"""
---------------- QUELQUES INFOS POUR CETTE VERSION ----------------
Consigne : faire un wordle

Le frontend est constitué du html, css et js. Le Backend du py.

Pour lancer le serveur en local, on a utilisé la commande suivante
dans bash : uvicorn main:app --reload

Les fichiers sont ici configurés pour une utilisation locale : voir
ligne 61 du py et ligne 3 du js
"""

# Importation des modules utiles
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse, HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from random import randint


# --------------------------------------------------------------------------------------------------------
# Ouverture d'un fichier de mots en anglais pour avoir une base de travail, on a 2040 mots de 5 lettres
# On a fait le tri des mots de 5 lettres parmi tous les mots par l'opération suivante, une fois pour toute
# La liste des mots initiale a été trouvée à l'adresse https://github.com/Taknok/French-Wordlist

# Fonction préliminaire
def choose_length(L, n):
    L2 = []
    for word in L:
        if len(word) == n:
            L2.append(word)
    return L2

# with open("francais.txt", "r") as wordlist:
#     WORDS = choose_length(wordlist.read().splitlines(), 5)

# with open("francais_5_lettres.txt", "w") as words:
#     for word in WORDS:
#         words.write(word+"\n")
# --------------------------------------------------------------------------------------------------------


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


@app.get("/solution/motdujour")
async def get_word():
    with open("francais_5_lettres.txt", "r") as fichier:
        WORDS = fichier.read().splitlines()
    nb = randint(0, len(WORDS)-1)
    return JSONResponse({
        "mot": WORDS[nb]
    })

@app.get("/dico/{mot}")
async def is_in_dictionary(mot :str):
    with open("francais_5_lettres.txt", "r") as fichier:
        WORDS = fichier.read().splitlines()
    if mot.lower() in WORDS:
        return JSONResponse({
            "result": True
        })
    else:
        return JSONResponse({
            "result": False
        })