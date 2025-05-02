// Le projet a été configuré en local (voir ligne suivante)
const LOCAL_ADD = "http://127.0.0.1:8000"

// Autre constante utile :
let current_word = change_word()

document.addEventListener("DOMContentLoaded", () => {
    
    // Change de mot toutes les 15 secondes
    let refreshInterval = setInterval(() => change_word(), 15_000)

    let grille = document.getElementById("grid")

    dessin_grille(grille)
    
    });



// Fonctions utilisées :
// 1. Permet le rafraichissement de la grille
function refresh(user_id) {
    fetch(`${PREFIX}/deltas?id=${user_id}`, {credentials: "include"})
        .then((response) => response.json())
        .then((json) => {
            let modif = json.deltas
            console.log(modif)

            modif.forEach((element) => {
                let pixel = document.getElementById(`${element[0]} ${element[1]}`)
                pixel.style.backgroundColor = `rgb(${element[2]}, ${element[3]}, ${element[4]})`
            })
        })
}


// 2. Permet de dessiner la grille de base
function dessin_grille(grid) {
    for (let pas1 = 0; pas1 < 6; pas1++) {
        for (let pas2 = 0; pas2 < 5; pas2++) {
        let boite = document.createElement("div");
        boite.style.backgroundColor = `rgb(100, 200, 100)`
        boite.id = `${pas1} ${pas2}`
        grid.appendChild(boite)
        console.log("ok")
    }
    }
}

// 3. Permet de récupérer un mot
function change_word() {
    fetch(`${LOCAL_ADD}/solution/motdujour`, {credentials: "include"})
        .then((response) => response.json())
        .then((json) => {
            let current_word = json.mot
            console.log(current_word)
            })

}
