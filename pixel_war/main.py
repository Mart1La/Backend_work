from copy import deepcopy
import time
from uuid import uuid4
from fastapi import Cookie, FastAPI, Query
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware


# TRUCS PAS COMPRIS et/ou pas finis:
#       - create_new_user_id




app = FastAPI()

@app.get("/")
async def root():
    return {"message": "Hello World"}

# On peut utiliser dans bash (pour lancer le serveur)
# uvicorn main:app --reload

# Permet d'autoriser le programme a fonctionner
app.add_middleware(CORSMiddleware,
                   allow_origins=["*", "localhost:8000"],
                   allow_credentials=True
                   )

"""
Les consignes coté frontend sont les suivantes: 
https://github.com/ue22-p24/web-pixels-war
"""


# Informations liées à chaque utilisateur
class UserInfo:
    last_seen_map: list[list[tuple[int, int, int]]]

    def __init__(self, carte):
        self.last_seen_map = deepcopy(carte)
        self.last_edited_time_nanos = 0

class Carte:
    keys: set[str]
    nx: int             # Largeur de la grille
    ny: int             # Longueur de la grille
    data: list[list[tuple[int, int, int]]]

    def __init__(self, nx:int, ny:int, timeout_nanos: int = 1_000_000_000):
        # Le timeout est en nanosecondes, on considère 1s par défaut
        
        # La carte est modifiée par plein d'utilisateurs auxquels
        # est associé une unique clé
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
        # Returns True if key already in, False elsewise
        return key in self.keys
    
    """ A MODIFIER / VERIFIER"""
    def create_new_user_id(self):
        user_id = str(uuid4())  # Génère un nouvel identifiant unique pour l'utilisateur
        self.user[user_id] = UserInfo(self.data)
        return user_id
    
        
    def is_valid_user_id(self, user_id:str):
        return user_id in self.user


cartes : dict[str, Carte] = {
    "0000": Carte(nx=10, ny=10, timeout_nanos=10_000_000_000),
    "TEST": Carte(nx=10, ny=10)
}

@app.get("/api/v1/{nom_carte}/preinit")
async def preinit(nom_carte: str): # Permet de recup le nom de la carte qu'on met dans la requete
    carte = cartes[nom_carte]
    if not carte:
        return {"Error": "carte inconnue! (voir preinit)"}

    key = carte.create_new_key()
    res = JSONResponse({"key": key})
    res.set_cookie("key", key, secure=True, samesite="none", max_age=3600)
    return res

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


# # https://pixels-war.oie-lab.net/api/v1/TEST/deltas?id={user_id}


@app.get("/api/v1/{nom_carte}/deltas")
async def deltas(nom_carte: str,
                 query_user_id: str = Query(alias="id"),
                 cookie_key: str = Cookie(alias="key"),
                 cookie_user_id: str = Cookie(alias="id")):
    
    carte = cartes[nom_carte]
    
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
    print(type(nom_carte), type(user_id), type(y), type(x), type(r), type(g))
    carte = cartes[nom_carte]

    # Vérifications classiques
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
        user_carte = user_info.last_seen_map
        user_carte[x][y] = (r, g, b)
        carte.data[x][y] = (r, g, b)
        return JSONResponse(content=0)
    else:
        return JSONResponse(content={f"Attendre {carte.timeout_nanos-(delta_time_ns)} nanosecondes"})