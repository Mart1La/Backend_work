// Le projet a été configuré en local (voir ligne suivante)
const PIXEL_URL = "http://127.0.0.1:8000"

// ON PEUT CHANGER LA CARTE ICI : 2 choix (TEST ou 0000)
// Il faudra recharger la page pour changer de carte
const MAP_ID = "TEST"

// Autre constante utile :
const PREFIX = `${PIXEL_URL}/api/v1/${MAP_ID}`

document.addEventListener("DOMContentLoaded", () => {
    let refreshInterval;

    document.getElementById("baseurl").value = PIXEL_URL
    document.getElementById("mapid").value = MAP_ID
    document.getElementById("baseurl").readOnly = true
    document.getElementById("mapid").readOnly = true

    // Preinitialisation
    fetch(`${PREFIX}/preinit`, {credentials: "include"})
        .then((response) => response.json())
        .then((json) => {
            
            // console.log(json)
            let cle = json.key
            // console.log(cle)

            // Recuperation de l'ID et affichage de la grille
            fetch(`${PREFIX}/init?key=${cle}`, {credentials: "include"})
                .then((response) => response.json())
                .then((json) => {

                    let id = json.id
                    let data = json.data
                    let nx = json.nx
                    let ny = json.ny

                    // La taille de la grille est ajustée selon nx et ny
                    let grille = document.getElementById("grid")
                    grille.style.gridTemplateColumns = `repeat(${nx}, 4px)`
                    grille.style.gridTemplateRows = `repeat(${ny}, 4px)`
                    dessin_grille(grille, data)
                    
                    // Rafraichissement de la grille toutes les 3 secondes
                    refreshInterval = setInterval(() => {
                        refresh(id)
                    }, 3000)

                    // Bouton refresh (voir fonction plus loin)
                    let elt = document.getElementById("refresh")
                    elt.addEventListener("click", () => {refresh(id)})

                    // Changement de la couleur du pixel
                    grille.addEventListener("click", (event) => {
                        let color_to_add = getPickedColorInRGB()
                        const cible = event.target;
                        if (cible.tagName === "DIV" && cible.parentElement === grid) {
                            setBg(cible, color_to_add, id, PREFIX);
                            refresh(id);
                        }
                    });
                })
        })
})

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

// 2. Permet de récupérer la couleur cliquée en RGB
function getPickedColorInRGB() {
    const colorHexa = document.getElementById("colorpicker").value

    const r = parseInt(colorHexa.substring(1, 3), 16)
    const g = parseInt(colorHexa.substring(3, 5), 16)
    const b = parseInt(colorHexa.substring(5, 7), 16)

    return [r, g, b]
}

// 3. Permet de dessiner la grille
function dessin_grille(grid, data) {
    for (let pas1 = 0; pas1 < data.length; pas1++)
        for (let pas2 = 0; pas2 < data[0].length; pas2++) {
        let pixel = document.createElement("div");
        pixel.style.backgroundColor = `rgb(${data[pas1][pas2][0]}, ${data[pas1][pas2][1]}, ${data[pas1][pas2][2]})`
        pixel.id = `${pas1} ${pas2}`
        grid.appendChild(pixel) }
}

// 4. Permet de changer la couleur des pixels de la grille
const setBg = (cible, color, identifiant, PREFIX) => {
    let coordinates = cible.id.split(" ");

    let y = coordinates[0].trim()  // Trim pour enlever les espaces
    let x = coordinates[1].trim()
    let r = color[0]
    let g = color[1]
    let b = color[2]

    fetch(`${PREFIX}/set/${identifiant}/${y}/${x}/${r}/${g}/${b}`, {credentials: "include"})
  }