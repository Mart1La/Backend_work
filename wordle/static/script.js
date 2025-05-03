// Le projet a été configuré en local
const LOCAL = "http://127.0.0.1:8000";


let current_word = change_word();   // constitue le mot à trouver
let increment = 0                   // va compter les lignes complètes

document.addEventListener("DOMContentLoaded", () => {

    // change le mot tous les jours
    setInterval(() => change_word(), 24*60*60_000);

    // Tracé de la grille
    let grille = document.getElementById("grid");
    dessin_grille(grille);

    // Gestion de la grille
    grille.addEventListener("click", (event) => {
        
        const cible = event.target;
        // Extraction de la colonne et de la ligne de la cible a partir de l'id
        const [row, col] = cible.id.split(" ").map(Number);

        // Vérifie que le clic se fait bien sur un div de la grille
        if (cible.tagName === "DIV" && cible.parentElement === grille) {

            // Cas ou c'est la premiere ligne, premiere colonne
            if (row === 0 && col === 0) {
                let user_input = prompt("Entrer une lettre majuscule");
                if (user_input === null || user_input === "") {
                    cible.innerHTML = ""
                } else if (user_input.length === 1 && /^[A-Z]+$/.test(user_input)) {
                    // console.log("ok pour col 0 et row 0");
                    cible.innerHTML = user_input;
                } else {
                    console.log("Erreur: format incorrect")
                }
            
            // Cas ou c'est la premiere colonne (on check la derniere colonne de la ligne d'avant)
            } else if (col === 0) {
                const prevCell = document.getElementById(`${row - 1} 4`);
                if (prevCell && prevCell.innerHTML !== "" && increment == row) {
                    let user_input = prompt("Entrer une lettre majuscule");
                    if (user_input === null || user_input === "") {
                        cible.innerHTML = ""
                    } else if (user_input.length === 1 && /^[A-Z]+$/.test(user_input)) {
                        // console.log("ok pour col 0 et row qcq");
                        cible.innerHTML = user_input;
                    } else {
                        console.log("Erreur: format incorrect")
                    }
                }

            // On check la case d'avant sur la meme ligne dans tous les autres cas
            } else {
                const prevCell = document.getElementById(`${row} ${col - 1}`);
                if (prevCell && prevCell.innerHTML !== "") {
                    let user_input = prompt("Entrer une lettre majuscule");
                    if (user_input === null || user_input === "") {
                        cible.innerHTML = ""
                    } else if (user_input.length === 1 && /^[A-Z]+$/.test(user_input)) {
                        // console.log("ok pour le reste");
                        cible.innerHTML = user_input;
                    } else {
                        console.log("Erreur: format incorrect pour le reste")
                    }
                }
            }
        }
    });

    // Gère l'appuie du bouton "valider"
    let elt = document.getElementById("enter")
    elt.addEventListener("click", () => {verif(increment)})
});

// Fonctions utilisées :
// 1. Permet de dessiner la grille de base
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

// 2. Permet de récupérer un mot, ce sera le mot du jour
function change_word() {
    fetch(`${LOCAL}/solution/motdujour`, { credentials: "include" })
        .then((response) => response.json())
        .then((json) => {
            current_word = json.mot;
            // console.log(current_word);
        });
}

// 3. Verifie la ligne n, et appelle les fonctions nécessaires en conséquence
function verif(n) {
    let c = 0;                  // Va compter les chaines de caractere non nulles.
    let concatenation = "";     // Va être le mot écrit dans les cases
    let elements = document.getElementsByClassName(n.toString());

    for (let i = 0; i < elements.length; i++) {
        if (elements[i].innerHTML !== "") {
            c = c + 1;
            concatenation = concatenation + elements[i].innerHTML;
        }
    }

    // Demande si le mot fait bien 5 lettres
    if (c === 5) { 

        // Vérifie que le mot est dans le dictionnaire francais
        fetch(`${LOCAL}/dico/${concatenation}`, { credentials: "include" })
            .then((response) => response.json())
            .then((json) => {
                let the_result = json.result;
                if (the_result === true) {  // Si le mot est dans le dictionnaire,
                    increment = n + 1
                    put_color(elements, concatenation)      // Gestion des couleurs
                    put_an_end(n, concatenation)            // Gestion de la fin éventuelle
                } else {
                    console.log("Mot inconnu, veuillez réessayer avec un autre mot")
                }
            });
        

    }
}

// 4. Met les couleurs sur la ligne n (gestion des duplicats ok)
function put_color(elements, concatenation) {
    let list_real_word = current_word.split("");
    let list_line_word = concatenation.toLowerCase().split("")

    // Variable intermédiaires utiles pour les couleurs
    let usedInRealWord = new Array(list_real_word.length).fill(false);
    let remaining = []

    // On marque d'abord les positions exactes en vert
    for (let i = 0; i < elements.length; i++) {
        if (list_real_word[i] === list_line_word[i]) {
            elements[i].style.backgroundColor = `rgb(23, 194, 23)`;
            usedInRealWord[i] = true
        } else {
            remaining.push(list_real_word[i])
        } }
    // console.log(remaining)
        
    // On marque ensuite les positions orange: ce sont les lettres de la ligne
    // qui sont dans les lettres marquees "false" dans usedInRealWord
    for (let i = 0; i < elements.length; i++) {
        if (!usedInRealWord[i]) {                           // Si false
            if (remaining.includes(list_line_word[i])) {
                elements[i].style.backgroundColor = `rgb(249, 148, 15)`;
                let index = remaining.indexOf(list_line_word[i])

                // Important pour éviter que les couleurs induisent en erreur avec les doublons
                remaining.splice(index, 1)  
            } else {
                elements[i].style.backgroundColor = `rgb(53, 49, 42)`
            }
        } 
    }
}

// 5. Gere la fin du jeu
function put_an_end(n, concatenation) {
    div_bouton = document.getElementById("enter_button")
    bouton = document.getElementById("enter")
    let for_comparison = concatenation.toLowerCase()

    // Si on a perdu
    if (n === 5 && for_comparison !== current_word) {
        increment = -10
        bouton.remove()

        // Un peu de css
        div_bouton.innerHTML = "Perdu! Le mot était: " + current_word;
        div_bouton.style.color = "red";
    }

    // Si on a gagné
    if (for_comparison === current_word) {
        increment = -10
        bouton.remove()

        // Un peu de css
        div_bouton.innerHTML = "Gagné! Le mot était: " + current_word;
        div_bouton.style.color = "green";

    }
}