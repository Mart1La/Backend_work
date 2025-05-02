// Le projet a été configuré en local (voir ligne suivante)
const LOCAL_ADD = "http://127.0.0.1:8000";

// Le mot change toutes les 10 minutes
let current_word = change_word();
let increment = 0 // va compter les lignes complètes

document.addEventListener("DOMContentLoaded", () => {

    setInterval(() => change_word(), 10*60_000);


    let grille = document.getElementById("grid");
    dessin_grille(grille);

    grille.addEventListener("click", (event) => {
        const cible = event.target;
        console.log(cible.id);

        // Extraction de la colonne et de la ligne de la cible a partir de l'id
        const [row, col] = cible.id.split(" ").map(Number);


        // Vérifie que le clic se fait bien sur un div de la grille
        if (cible.tagName === "DIV" && cible.parentElement === grille) {

            // Cas ou c'est la premiere ligne, premiere colonne
            if (row === 0 && col === 0) {
                let user_input = prompt("Please enter a capital letter");
                if (user_input === null || user_input === "") {
                    cible.innerHTML = ""
                } else if (user_input.length === 1 && /^[A-Z]+$/.test(user_input)) {
                    console.log("ok pour col 0 et row 0");
                    cible.innerHTML = user_input;
                } else {
                    console.log("Erreur: format incorrect pour c0 r0")
                }
            
            // Cas ou c'est la premiere colonne (on check la derniere colonne de la ligne d'avant)
            } else if (col === 0) {
                console.log(`increment=${increment}`)
                const prevCell = document.getElementById(`${row - 1} 4`);
                if (prevCell && prevCell.innerHTML !== "" && increment == row) {
                    let user_input = prompt("Please enter a capital letter");
                    if (user_input === null || user_input === "") {
                        cible.innerHTML = ""
                    } else if (user_input.length === 1 && /^[A-Z]+$/.test(user_input)) {
                        console.log("ok pour col 0 et row qcq");
                        cible.innerHTML = user_input;
                    } else {
                        console.log("Erreur: format incorrect pour c0 rqcq")
                    }
                }

            // On check la case d'avant sur la meme ligne dans tous les autres cas
            } else {
                const prevCell = document.getElementById(`${row} ${col - 1}`);
                if (prevCell && prevCell.innerHTML !== "") {
                    let user_input = prompt("Please enter a capital letter");
                    if (user_input === null || user_input === "") {
                        cible.innerHTML = ""
                    } else if (user_input.length === 1 && /^[A-Z]+$/.test(user_input)) {
                        console.log("ok pour le reste");
                        cible.innerHTML = user_input;
                    } else {
                        console.log("Erreur: format incorrect pour le reste")
                    }
                }
            }
        }
    });


    let elt = document.getElementById("enter")
    elt.addEventListener("click", () => {verif(increment)})
});

// Fonctions utilisées :
// 1. Permet le rafraichissement de la grille
function refresh(user_id) {
    fetch(`${PREFIX}/deltas?id=${user_id}`, { credentials: "include" })
        .then((response) => response.json())
        .then((json) => {
            let modif = json.deltas;
            console.log(modif);

            modif.forEach((element) => {
                let pixel = document.getElementById(`${element[0]} ${element[1]}`);
                pixel.style.backgroundColor = `rgb(${element[2]}, ${element[3]}, ${element[4]})`;
            });
        });
}

// 2. Permet de dessiner la grille de base
function dessin_grille(grid) {
    for (let pas1 = 0; pas1 < 6; pas1++) {
        for (let pas2 = 0; pas2 < 5; pas2++) {
            let boite = document.createElement("div");
            boite.style.backgroundColor = `rgb(203, 214, 203)`;
            boite.id = `${pas1} ${pas2}`;
            boite.classList.add(`${pas1}`)
            grid.appendChild(boite);
        }
    }
}

// 3. Permet de récupérer un mot
function change_word() {
    fetch(`${LOCAL_ADD}/solution/motdujour`, { credentials: "include" })
        .then((response) => response.json())
        .then((json) => {
            current_word = json.mot;
            console.log(current_word);
        });
}


// 4. Verifie la ligne n
function verif(n) {
    let c = 0; // Corrected variable name
    let concatenation = "";
    let elements = document.getElementsByClassName(n.toString());

    for (let i = 0; i < elements.length; i++) {
        if (elements[i].innerHTML !== "") {
            c = c + 1;
            concatenation = concatenation + elements[i].innerHTML;
        }
    }

    console.log(`c=${c}`);

    if (c === 5) { // demande si le mot existe dans le dictionnaire
        fetch(`${LOCAL_ADD}/dico/${concatenation}`, { credentials: "include" })
            .then((response) => response.json())
            .then((json) => {
                let the_result = json.result;
                if (the_result === true) {
                    increment = n + 1
                    console.log(increment)
                } else {
                    console.log("Mot inconnu, veuillez réessayer avec un autre mot")
                }
            });

    }
}
