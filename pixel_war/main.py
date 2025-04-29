from copy import deepcopy
import time
from uuid import uuid4
from fastapi import Cookie, FastAPI, Query
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Permet d'autoriser le programme a fonctionner
app.add_middleware(CORSMiddleware,
                   allow_origins=["*", "localhost:8000"],
                   allow_credentials=True
                   )


class UserInfo:
    last_seen_map: list[list[tuple[int, int, int]]]

    def __init__(self, carte):
        self.last_seen_map = deepcopy(carte)
        self.last_edited_time_nanos = 0

class Carte:
    keys: set[str]
    nx: int
    ny: int
    data: list[list[tuple[int, int, int]]]

    def __init__(self, nx:int, ny:int, timeout_nanos: int = 10000000000):
        self.keys = set()
        self.nx = nx
        self.ny = ny
        self.data = [
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
        return key in self.keys
    
    """
    def create_new_user_id(self):
        user_id = str(uuid4())  # Génère un nouvel identifiant unique pour l'utilisateur
        self.user[user_id] = 
        return user_id
    """
        
    def is_valid_user_id(self, user_id:str):
        return user_id in self.user


cartes : dict[str, Carte] = {
    "0000": Carte(nx=10, ny=10)
}

@app.get("/api/v1/{nom_carte}/preinit")
async def preinit(nom_carte: str): # Permet de recup le nom de la carte qu'on met dans la requete
    carte = cartes[nom_carte]
    if not carte:
        return {"error": "Je n'ai pas trouvé la carte"}

    key = cartes[carte].create_new_key()
    res = JSONResponse({"key": key})
    res.set_cookie("key", key, secure=True, samesite="none", max_age=3600)
    return res


# https://pixels-war.oie-lab.net/api/v1/TEST/init?key={some_key}

@app.get("/api/v1/{nom_carte}/init")
async def init(nom_carte: str,
               query_key: str = Query(alias="key"),
               cookie_key: str = Cookie(alias="key")):
    carte = cartes[nom_carte]
    if carte is None:
        return {"error": "Je n'ai pas trouvé la carte"}
    if query_key != cookie_key:
        return {"Les cles correspondent pas"}
    if not carte.is_valid_key(cookie_key):
        return {"error: cle non valide"}

    user_id = carte.create_new_user_id()
    res = JSONResponse({
        "id": "user id",
        "nx": carte.nx,
        "ny": carte.ny,
        "timeout": carte.timeout_nanos,
        "data": carte.data
    })

    res.set_cookie("id", user_id, secure=True, samesite="none", max_age=3600)
    return res


# https://pixels-war.oie-lab.net/api/v1/TEST/deltas?id={user_id}


@app.get("/api/v1/{nom_carte}/deltas")
async def deltas(nom_carte: str,
                 query_user_id: str = Query(alias="id"),
                 cookie_key: str = Cookie(alias="key"),
                 cookie_user_id: str = Query(alias="id"),):
    carte = cartes[nom_carte]
    if carte is None:
        return {"error": "Je n'ai pas trouvé la carte"}
    if query_user_id != cookie_user_id:
        return {"Les cles correspondent pas"}
    if not carte.is_valid_key(cookie_key):
        return {"error: cle non valide"}
    if not carte.is_valid_user_id(query_user_id):
        return {"error": "la cle n'est pas valide"}
    

    user_info = carte.users[query_user_id]
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