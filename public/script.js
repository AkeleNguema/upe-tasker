// COMPOSANTS DANS L'ARBRE MÉMOIRE (DOM)
const formulaireTaches = document.getElementById('task-form');
const champSaisieTache = document.getElementById('task-input');
const conteneurListeTaches = document.getElementById('task-list');

// FONCTION DU CHARGEMENT INITIAL DES DONNÉES DEPUIS MONGO_DB (Désérialisation)
function chargerLesTachesDepuisLeServeur() {
    fetch('/api/tasks')
        .then(response => response.json())
        .then(taches => {
            conteneurListeTaches.innerHTML = ""; // Vide la liste pour éviter les doublons
            taches.forEach(tache => {
                afficherUneTacheDansLeDOM(tache.label, tache._id);
            });
        })
        .catch(erreur => console.error("Erreur lors du chargement initial :", erreur));
}

// FONCTION : SÉRIALISATION ET ENVOI DE LA NOUVELLE TÂCHE (CREATE)
function enregistrerTacheSurLeServeur(texteTache) {
    const corpsRequete = JSON.stringify({ label: texteTache });

    fetch('/api/tasks', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: corpsRequete
    })
    .then(response => response.json())
    .then(tacheEnregistree => {
        afficherUneTacheDansLeDOM(tacheEnregistree.label, tacheEnregistree._id);
    })
    .catch(erreur => {
        console.error("Erreur réseau détectée :", erreur);
        alert("Action impossible : Échec de l'enregistrement sur le serveur.");
    });
}

// FONCTION DE MISE À JOUR DU TEXTE SUR LE SERVEUR (UPDATE)
function modifierTexteTacheSurLeServeur(idTache, nouveauTexte, elementTexte) {
    const corpsRequete = JSON.stringify({ label: nouveauTexte });

    fetch(`/api/tasks/${idTache}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: corpsRequete
    })
    .then(response => {
        if (!response.ok) throw new Error("Échec de la mise à jour côté serveur");
        return response.json();
    })
    .then(tacheModifiee => {
        elementTexte.textContent = tacheModifiee.label;
    })
    .catch(erreur => console.error("Erreur lors de la mise à jour :", erreur));
}

// FONCTION DE SUPPRESSION SUR LE SERVEUR (DELETE)
function supprimerTacheSurLeServeur(idTache, elementHtmlAEffacer) {
    fetch(`/api/tasks/${idTache}`, {
        method: 'DELETE'
    })
    .then(response => response.json())
    .then(() => {
        elementHtmlAEffacer.remove(); // Retire l'élément visuel du DOM
    })
    .catch(erreur => {
        console.error("Erreur lors de la suppression réseau :", erreur);
        alert("Impossible de supprimer cette tâche pour le moment.");
    });
}

// FONCTION : MANIPULATION DIRECTE DU DOM (AVEC TEXTES SIMPLES SANS ICÔNES)
function afficherUneTacheDansLeDOM(texte, idTache) {
    const nouvelElementLi = document.createElement('li');
    nouvelElementLi.classList.add('task-item');

    // 1. Zone de texte sécurisée
    const zoneTexte = document.createElement('span');
    zoneTexte.textContent = texte;
    nouvelElementLi.appendChild(zoneTexte);

    // Conteneur pour aligner les boutons à droite
    const conteneurActions = document.createElement('div');
    conteneurActions.style.display = 'flex';
    conteneurActions.style.gap = '5px';

    // 2. CRÉATION DU COMPOSANT UPDATE : Le Bouton "Modifier" en texte pur
    const boutonModifier = document.createElement('button');
    boutonModifier.textContent = "Mod";
    boutonModifier.classList.add('edit-btn');
    boutonModifier.style.cursor = "pointer";

    // Événement d'édition au clic sur le bouton
    boutonModifier.addEventListener('click', () => {
        if (nouvelElementLi.querySelector('input[type="text"]')) return;

        const texteActuel = zoneTexte.textContent;
        const champEdition = document.createElement('input');
        champEdition.type = 'text';
        champEdition.value = texteActuel;

        nouvelElementLi.replaceChild(champEdition, zoneTexte);
        champEdition.focus();

        // Le bouton change temporairement de texte pour la validation
        boutonModifier.textContent = "Enregistrer";

        const sauvegarderChangements = () => {
            const intituleModifie = champEdition.value.trim();
            if (intituleModifie !== "") {
                modifierTexteTacheSurLeServeur(idTache, intituleModifie, zoneTexte);
            }
            nouvelElementLi.replaceChild(zoneTexte, champEdition);
            boutonModifier.textContent = "Mod";
        };

        champEdition.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sauvegarderChangements();
        });

        const actionUniqueSauvegarde = () => {
            sauvegarderChangements();
            boutonModifier.removeEventListener('click', actionUniqueSauvegarde);
        };
        boutonModifier.addEventListener('click', actionUniqueSauvegarde, { once: true });
    });

    conteneurActions.appendChild(boutonModifier);

    // 3. CRÉATION DU COMPOSANT DELETE : Le Bouton "Supprimer" en texte pur
    const boutonSupprimer = document.createElement('button');
    boutonSupprimer.textContent = "Sup";
    boutonSupprimer.classList.add('delete-btn');
    boutonSupprimer.style.cursor = "pointer";
    
    boutonSupprimer.addEventListener('click', () => {
        supprimerTacheSurLeServeur(idTache, nouvelElementLi);
    });
    conteneurActions.appendChild(boutonSupprimer);

    // Injection finale dans la ligne
    nouvelElementLi.appendChild(conteneurActions);
    conteneurListeTaches.appendChild(nouvelElementLi);
}

// PHASE 2 : BRANCHEMENT DU COMPORTEMENT APPLICATIF VIA L'ÉCOUTEUR
formulaireTaches.addEventListener('submit', function(evenementCapture) {
    evenementCapture.preventDefault();
    const intituleTacheNettoye = champSaisieTache.value.trim();
    
    if (intituleTacheNettoye === "") {
        alert("Erreur de saisie : L'intitulé de la tâche universitaire ne peut être vide.");
        return; 
    }
    
    enregistrerTacheSurLeServeur(intituleTacheNettoye);
    
    champSaisieTache.value = "";
    champSaisieTache.focus();
});

// INVOCATION INITIALE
chargerLesTachesDepuisLeServeur();