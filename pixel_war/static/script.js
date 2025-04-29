// pour l'instant on ne peut pas y toucher depuis l'interface
// il faut recharger la page pour changer de carte
const PIXEL_URL = "http://127.0.0.1:8000"

// ON PEUT CHANGER LA CARTE ICI : 2 choix (TEST ou 0000)
// const MAP_ID = "0000"
const MAP_ID = "0000"

document.addEventListener("DOMContentLoaded", () => {

    const PREFIX = `${PIXEL_URL}/api/v1/${MAP_ID}`
    let refreshInterval;

    // pour savoir à quel serveur / carte on s'adresse
    // on les affiche en dur
    // pour l'instant on ne peut pas y toucher depuis l'interface
    // il faut recharger la page pour changer de carte
    document.getElementById("baseurl").value = PIXEL_URL
    document.getElementById("mapid").value = MAP_ID
    document.getElementById("baseurl").readOnly = true
    document.getElementById("mapid").readOnly = true

    fetch(`${PREFIX}/preinit`, {credentials: "include"})
        .then((response) => response.json())
        .then((json) => {
            console.log(json)
            //TODO: maintenant que j'ai le json de preinit, je peux initialiser ma grille
            let cle = json.key
            console.log(cle)

            //TODO: maintenant que j'ai le JSON, afficher la grille, et récupérer l'id
            fetch(`${PREFIX}/init?key=${cle}`, {credentials: "include"})
                .then((response) => response.json())
                .then((json) => {
                    // console.log(json)
                    let id = json.id
                    let data = json.data
                    let nx = json.nx
                    let ny = json.ny

                    // La taille de la grille est ajustée selon nx et ny
                    let grille = document.getElementById("grid")
                    grille.style.gridTemplateColumns = `repeat(${nx}, 4px)`
                    grille.style.gridTemplateRows = `repeat(${ny}, 4px)`
                    dessin_grille(grille, data)
                    
                    // Rafraichissement de la grille toute les 3 secondes
                    refreshInterval = setInterval(() => {
                        refresh(id)
                    }, 3000)

                    //TODO: maintenant que j'ai l'id, attacher la fonction refresh(id), à compléter, au clic du bouton refresh
                    let elt = document.getElementById("refresh")
                    elt.addEventListener("click", () => {refresh(id)})


                    //TODO: attacher au clic de chaque pixel une fonction qui demande au serveur de colorer le pixel sous là forme :
                    // http://pixels-war.oie-lab.net/api/v1/0000/set/id/x/y/r/g/b
                    // la fonction getPickedColorInRGB ci-dessous peut aider

                    grille.addEventListener("click", (event) => {
                        let color_to_add = getPickedColorInRGB()
                        const cible = event.target;
                        if (cible.tagName === "DIV" && cible.parentElement === grid) {
                            setBg(cible, color_to_add, id, PREFIX);
                            refresh(id);
                        }
                    });

                    document.getElementById("colorpicker").addEventListener("input", (event) => {
                        const color = event.target.value;
                        console.log(`Couleur choisie : ${color}`);
                    });  

                })

            // cosmétique / commodité / bonus:

            // TODO: pour être efficace, il serait utile d'afficher quelque part
            // les coordonnées du pixel survolé par la souris

            //TODO: pour les rapides: afficher quelque part combien de temps
            // il faut attendre avant de pouvoir poster à nouveau

            //TODO: pour les avancés: ça pourrait être utile de pouvoir
            // choisir la couleur à partir d'un pixel ?

        })

    //TODO: pour les élèves avancés, comment transformer les "then" ci-dessus en "async / await" ?
    //TODO: pour les élèves avancés, faire en sorte qu'on puisse changer de carte
    //      voir le bouton Connect dans le HTML

    // À compléter puis à attacher au bouton refresh en passant mon id une fois récupéré
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

    // Petite fonction facilitatrice pour récupérer la couleur cliquée en RGB
    function getPickedColorInRGB() {
        const colorHexa = document.getElementById("colorpicker").value

        const r = parseInt(colorHexa.substring(1, 3), 16)
        const g = parseInt(colorHexa.substring(3, 5), 16)
        const b = parseInt(colorHexa.substring(5, 7), 16)

        return [r, g, b]
    }

})

function dessin_grille(grid, data) {
    for (let pas1 = 0; pas1 < data.length; pas1++)
        for (let pas2 = 0; pas2 < data[0].length; pas2++) {
        let pixel = document.createElement("div");
        pixel.style.backgroundColor = `rgb(${data[pas1][pas2][0]}, ${data[pas1][pas2][1]}, ${data[pas1][pas2][2]})`
        pixel.id = `${pas1} ${pas2}`
        grid.appendChild(pixel) }
  }

  const setBg = (cible, color, identifiant, PREFIX) => {

    let coordinates = cible.id.split(" ");
    let y = coordinates[0].trim();  // Trim pour enlever les espaces
    let x = coordinates[1].trim();  // Trim pour enlever les espaces
    let r = color[0];
    let g = color[1];
    let b = color[2];
    // console.log(x)
    fetch(`${PREFIX}/set/${identifiant}/${y}/${x}/${r}/${g}/${b}`, {credentials: "include"})
  }
