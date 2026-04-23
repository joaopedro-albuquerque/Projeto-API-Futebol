const express = require('express');
const router = express.Router();
const timesController = require('../controllers/times');

// Route to get all teams
router.get('/', timesController.getAllTeams);

// Route to get a team by ID
router.get('/:id', timesController.getTeamById);

// Route to create a new team
router.post('/', timesController.createTeam);

// Route to update a team by ID
router.put('/:id', timesController.updateTeam);

// Route to delete a team by ID
router.delete('/:id', timesController.deleteTeam);

module.exports = router;