// INCLUSION DES MODULES VIA COMMONJS
const express = require('express');
const path = require('path');
const mongoose = require('mongoose');

// INITIALISATION DE L'APPLICATION ET CONFIGURATION DES PARAMÈTRES
const app = express();
const PORT_RESEAU = 3000;

// MISE EN PLACE DES MIDDLEWARES : Configuration de la distribution statique et décodage JSON
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json()); 

// CONNEXION À LA BASE DE DONNÉES MONGO_DB
mongoose.connect('mongodb://localhost:27017/upe-tasker')
    .then(() => console.log(" -> Connexion réussie à la base de données MongoDB !"))
    .catch(err => console.error("Erreur de connexion à MongoDB :", err));

// DÉFINITION DU SCHÉMA ET DU MODÈLE MONGOOSE
const SchemaTache = new mongoose.Schema({
    label: { type: String, required: true },
    completed: { type: Boolean, default: false }
});

const Tache = mongoose.model('Tache', SchemaTache);

// ROUTAGE API : PERSISTANCE ET LOGIQUE CRUD (MONGO_DB)

// ROUTE : Récupérer toutes les tâches présentes dans MongoDB (READ)
app.get('/api/tasks', async (requestClient, responseServeur) => {
    try {
        const listeTaches = await Tache.find(); 
        responseServeur.json(listeTaches); 
    } catch (erreur) {
        responseServeur.status(500).json({ error: "Erreur lors de la récupération des tâches" });
    }
});

// ROUTE : Ajouter une nouvelle tâche dans MongoDB (CREATE)
app.post('/api/tasks', async (requestClient, responseServeur) => {
    try {
        const nouveauLabel = requestClient.body.label;
        if (!nouveauLabel || nouveauLabel.trim() === "") {
            return responseServeur.status(400).json({ error: "Le libellé de la tâche est obligatoire." });
        }

        const nouvelleTache = new Tache({ label: nouveauLabel.trim() });
        await nouvelleTache.save(); 

        responseServeur.status(201).json(nouvelleTache); 
    } catch (erreur) {
        responseServeur.status(500).json({ error: "Erreur lors de l'enregistrement de la tâche" });
    }
});

// ROUTE : Modifier le statut ou le texte d'une tâche (UPDATE)
app.put('/api/tasks/:id', async (requestClient, responseServeur) => {
    try {
        const idTache = requestClient.params.id;
        const donneesAUpdate = requestClient.body; 

        const tacheModifiee = await Tache.findByIdAndUpdate(idTache, donneesAUpdate, { new: true });

        if (!tacheModifiee) {
            return responseServeur.status(404).json({ error: "Tâche introuvable" });
        }

        responseServeur.json(tacheModifiee);
    } catch (erreur) {
        responseServeur.status(500).json({ error: "Erreur lors de la modification" });
    }
});

// ROUTE : Supprimer une tâche dans MongoDB (DELETE)
app.delete('/api/tasks/:id', async (requestClient, responseServeur) => {
    try {
        const idTache = requestClient.params.id;

        // Validation de sécurité : vérifie si l'ID passé a le bon format MongoDB (24 caractères)
        if (!mongoose.Types.ObjectId.isValid(idTache)) {
            return responseServeur.status(400).json({ error: "Format d'identifiant invalide." });
        }

        const tacheSupprimee = await Tache.findByIdAndDelete(idTache);

        if (!tacheSupprimee) {
            return responseServeur.status(404).json({ error: "Tâche introuvable en base." });
        }

        responseServeur.json({ message: "La tâche a été supprimée avec succès." });
    } catch (erreur) {
        console.error("Erreur serveur DELETE :", erreur);
        responseServeur.status(500).json({ error: "Erreur interne lors de la suppression." });
    }
});

// ROUTE API TECHNIQUE DE CONTRÔLE DE SANTÉ
app.get('/api/status', (requestClient, responseServeur) => {
    responseServeur.json({
        status: "operational",
        serverTime: new Date().toISOString(),
        author: "GIR2",
        academicContext: {
            chapter: 3,
            topic: "Persistance des données avec MongoDB et Mongoose"
        }
    });
});

// INITIATION ACTIVE DU PROCESSUS D'ÉCOUTE RESEAU
app.listen(PORT_RESEAU, () => {
    console.log(" UNIVERSITÉ PRIVÉE DE L'ESTUAIRE - INFRASTRUCTURE APPLICATIVE");
    console.log(` -> Serveur HTTP démarré avec succès sur l'environnement local : http://localhost:${PORT_RESEAU}`);
});