"""
---------- QUELQUES INFOS POUR CETTE VERSION ---------- 
Consignes frontend : https://github.com/ue22-p24/web-pixels-war
Le frontend est constitué du html, css et js. Le Backend du py.

Pour lancer le serveur en local, on a utilisé la commande suivante
dans bash : uvicorn main:app --reload

Le choix de la map (TEST ou 0000) se fait "à la main" et
    - si TEST est choisi, le délai entre deux changements est 1s
    - si 0000 est choisi, le délai entre deux changements est 10s

Les fichiers sont ici configurés pour une utilisation locale,
on pourra changer la ligne 44 du py, la ligne 2 du js
    
"""

# Importation des modules utiles
from copy import deepcopy
import time
from uuid import uuid4
from fastapi import Cookie, FastAPI, Query, Request
from fastapi.responses import JSONResponse, HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates


# Instance de FastAPI
app = FastAPI()

# Fichiers statiques (css et js)
app.mount("/static", StaticFiles(directory="static"), name="static")

# Templates
templates = Jinja2Templates(directory="templates")

# Permet d'afficher la page HTML dès le début
@app.get("/", response_class=HTMLResponse)
async def root(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

# Permet d'autoriser le programme à fonctionner (à changer si plus en local)
app.add_middleware(CORSMiddleware,
                   allow_origins=["http://localhost:8000"],
                   allow_credentials=True,
                   allow_methods=["*"],
                   allow_headers=["*"]
                   )

# Informations liées à chaque utilisateur
class UserInfo:
    last_seen_map: list[list[tuple[int, int, int]]]

    def __init__(self, carte):
        self.last_seen_map = deepcopy(carte)
        self.last_edited_time_nanos = 0

# Informations sur chaque carte
class Carte:
    keys: set[str]      # Clés associées à la carte
    nx: int             # Largeur de la grille
    ny: int             # Longueur de la grille
    data: list[list[tuple[int, int, int]]]

    def __init__(self, nx:int, ny:int, timeout_nanos: int = 1_000_000_000):
        # Le timeout est en nanosecondes, on considère 1s par défaut
        
        # La carte est modifiée par plein d'utilisateurs auxquels
        # est associé une clé et un identifiant unique
        self.keys = set() 
        self.nx = nx
        self.ny = ny
        self.data = [                       # Initialisation en noir
            [(0, 0, 0) for _ in range(ny)]
            for _ in range(nx)
        ]
        self.timeout_nanos = timeout_nanos
        self.user = dict()
    
    def create_new_key(self):
        key = str(uuid4())
        self.keys.add(key)
        return key

    def is_valid_key(self, key: str):
        # Returns True if key already known, False otherwise
        return key in self.keys
    
    def create_new_user_id(self):
        user_id = str(uuid4())  # Génère un nouvel identifiant unique pour l'utilisateur
        self.user[user_id] = UserInfo(self.data)
        return user_id
        
    def is_valid_user_id(self, user_id:str):
        return user_id in self.user

# Dictionnaire avec les cartes connues, ici il y a seulement 0000 et TEST, avec un délai distinct
cartes : dict[str, Carte] = {
    "0000": Carte(nx=100, ny=100, timeout_nanos=10_000_000_000),
    "TEST": Carte(nx=10, ny=10)
}

# Preinitialisation
@app.get("/api/v1/{nom_carte}/preinit")
async def preinit(nom_carte: str): # Permet de recup le nom de la carte qu'on met dans la requete
    carte = cartes[nom_carte]
    if not carte:
        return {"Error": "carte inconnue! (voir preinit)"}

    key = carte.create_new_key()
    res = JSONResponse({"key": key})

    # On stocke des cookies pour bien identifier d'où viennent les requêtes pour éviter la triche
    res.set_cookie("key", key, secure=True, samesite="none", max_age=3600)
    return res

# Initialisation
@app.get("/api/v1/{nom_carte}/init")
async def init(nom_carte: str,
               query_key: str = Query(alias="key"),
               cookie_key: str = Cookie(alias="key")):
    carte = cartes[nom_carte]
    if carte is None:
        return {"Error": "Carte inconnue (voir init)"}
    
    # L'instruction suivante permet de ne pas tricher, si la requete
    # peut être modifiée facilement, ce n'est pas le cas de la cookie_key
    if query_key != cookie_key:
        return {"Error": "Les cles correspondent pas"}
    
    if not carte.is_valid_key(cookie_key):
        return {"Error": "Cle non valide (n'a jamais été générée!)"}

    user_id = carte.create_new_user_id()
    res = JSONResponse({
        "id": user_id,
        "nx": carte.nx,
        "ny": carte.ny,
        "data": carte.data,
        "timeout": carte.timeout_nanos,
    })

    res.set_cookie("id", user_id, secure=True, samesite="none", max_age=3600)
    return res

# Inspection des différences
@app.get("/api/v1/{nom_carte}/deltas")
async def deltas(nom_carte: str,
                 query_user_id: str = Query(alias="id"),
                 cookie_key: str = Cookie(alias="key"),
                 cookie_user_id: str = Cookie(alias="id")):
    
    carte = cartes[nom_carte]
    
    # Vérifications de non-triche
    if not carte:
        return {"Error": "Carte inconnue (deltas)"}
    if query_user_id != cookie_user_id:
        return {"Error": "Les user_id ne correspondent pas"}
    if not carte.is_valid_key(cookie_key):
        return {"Error": "Cle non valide (n'a jamais été générée!)"}
    if not carte.is_valid_user_id(query_user_id):
        return {"Error": "User_id non valide (n'existe pas)"}
    

    user_info = carte.user[query_user_id]
    user_carte = user_info.last_seen_map

    deltas : list[tuple[int, int, int, int, int]] = []
    for y in range(carte.ny):
        for x in range(carte.nx):
            if carte.data[x][y] != user_carte[x][y]:
                deltas.append((y, x, *carte.data[x][y]))
    return {
        "id": query_user_id,
        "nx": carte.nx,
        "ny": carte.ny,
        "deltas": deltas
    }

# Changement d'un pixel
@app.get("/api/v1/{nom_carte}/set/{user_id}/{y}/{x}/{r}/{g}/{b}")
async def change_color(nom_carte : str,
                    user_id : str,
                    y: int,
                    x: int,
                    r: int,
                    g: int,
                    b: int,
                    cookie_key: str = Cookie(alias="key"),
                    cookie_user_id: str = Cookie(alias="id")
                    ):
    
    carte = cartes[nom_carte]

    # Vérifications de non-triche
    if not carte:
        return {"Error": "Carte inconnue (deltas)"}
    if not carte.is_valid_key(cookie_key):
        return {"Error": "Cle non valide (n'a jamais été générée!)"}
    if not carte.is_valid_user_id(cookie_user_id):
        return {"Error": "User_id non valide (n'existe pas)"}

    user_info = carte.user[user_id]
    delta_time_ns = time.time_ns() - user_info.last_edited_time_nanos

    if delta_time_ns >= carte.timeout_nanos:
        user_info.last_edited_time_nanos = time.time_ns()
        carte.data[x][y] = (r, g, b)
        return JSONResponse(content=0)
    else:
        print(f"Attendre {round((carte.timeout_nanos-(delta_time_ns))/1_000_000_000, 2)} seconde(s)")
        return JSONResponse(content=f"Attendre {carte.timeout_nanos-(delta_time_ns)} nanosecondes")