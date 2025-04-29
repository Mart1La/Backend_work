// pour l'instant on ne peut pas y toucher depuis l'interface
// il faut recharger la page pour changer de carte
const PIXEL_URL = "https://pixels-war.oie-lab.net"

// c'est sans doute habile de commencer avec la carte de test
// const MAP_ID = "0000"
const MAP_ID = "TEST"

document.addEventListener("DOMContentLoaded", () => {

    const PREFIX = `${PIXEL_URL}/api/v1/${MAP_ID}`

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
                    let grille = document.getElementById("grid")
                    dessin_grille(grille, data)
                    
                    //TODO: maintenant que j'ai l'id, attacher la fonction refresh(id), à compléter, au clic du bouton refresh
                    let elt = document.getElementById("refresh")
                    elt.addEventListener("click", () => {refresh(id)})


                    //TODO: attacher au clic de chaque pixel une fonction qui demande au serveur de colorer le pixel sous là forme :
                    // http://pixels-war.oie-lab.net/api/v1/0000/set/id/x/y/r/g/b
                    // la fonction getPickedColorInRGB ci-dessous peut aider
                    let color_to_add = getPickedColorInRGB()
                    let grille2 = document.querySelector("#grid")
                    grille2.addEventListener("click", (event) => {
                      const cible = event.target;
                      if (cible.tagName === "DIV" && cible.parentElement === grid) {
                          setBg(cible, color_to_add, id, PREFIX);
                      }
                    });



                })

            //TODO: pourquoi pas rafraichir la grille toutes les 3 sec ?
            // voire même rafraichir la grille après avoir cliqué sur un pixel ?

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
                modif.forEach((element) => 
                    document.getElementById(`${element[0]} ${element[1]}`).style.backgroundColor = `rgb(${element[2]}, ${element[3]}, ${element[4]})`)

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

    // dans l'autre sens, pour mettre la couleur d'un pixel dans le color picker
    // (le color picker insiste pour avoir une couleur en hexadécimal...)
    function pickColorFrom(div) {
        // plutôt que de prendre div.style.backgroundColor
        // dont on ne connait pas forcément le format
        // on utilise ceci qui retourne un 'rbg(r, g, b)'
        const bg = window.getComputedStyle(div).backgroundColor
        // on garde les 3 nombres dans un tableau de chaines
        const [r, g, b] = bg.match(/\d+/g)
        // on les convertit en hexadécimal
        const rh = parseInt(r).toString(16).padStart(2, '0')
        const gh = parseInt(g).toString(16).padStart(2, '0')
        const bh = parseInt(b).toString(16).padStart(2, '0')
        const hex = `#${rh}${gh}${bh}`
        // on met la couleur dans le color picker
        document.getElementById("colorpicker").value = hex
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

    // console.log(cible.id)
    let x = cible.id[0]
    let y = cible.id[2]
    r = color[0]
    g = color[1]
    b = color[2]

    console.log(x)
    fetch(`${PREFIX}/set/${identifiant}/${x}/${y}/${r}/${g}/${b}`, {credentials: "include"})
  }

// IL reste juste a update avec la couleur de la palette