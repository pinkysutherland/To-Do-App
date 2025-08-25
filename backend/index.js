// --------------------------- ↓ SETTING UP DEPENDENCIES ↓ --------------------------------


require("dotenv").config();
const express = require("express"); // enables use of express.js
const cors = require("cors"); // Enables Cross Origin Resource Sharing
const mongoose = require("mongoose"); //enables use of MongoDB





// ---------------------------- ↓ INITIAL APP CONFIGURATION ↓ -----------------------------


const port = process.env.PORT || 3000; //uses port number on device to serve the backend (Live)
const app = express(); //using Express.js to power the app



// -------------------------------- ↓ MIDDLEWARE SETUP ↓ -----------------------------------

app.use(express.json()); // Uses express in JSON format
app.use(cors('*')); // Enables use of CORS - * means every domain is now allowed acces to this server to send and receive data - not secure - * is for development only



// ---------------------------------- ↓ Database connection + app startup ↓ --------------------------------------


//(() => {}) (); // IIFE - Imediately Invoked Funcion Expression

(async () => {
    try {
        
        mongoose.set("autoIndex", false);

        await mongoose.connect(process.env.MONGO_URI);
        console.log(" MongoDB Connected!");
        
        await Task.syncIndexes();
        console.log(" Indexes created!");

        app.listen(port, () => {
            console.log(`To Do App is live on port ${port}`);
        });

    } catch (error) {
        console.error("X Startup error:", error);
        process.exit(1); // Shutdown the server
    }
}) ();


// Define the task Schema (data structure)
const taskSchema = new mongoose.Schema({
    title: {type: String, required: true},
    description: {type: String, required: true},
    dueDate: {type: Date, required: true},
    createdOn: {type: Date, default: Date.now, required: true},
    completed: {type: Boolean, required: true, default: false}
});


taskSchema.index({ dueDate: 1});
taskSchema.index({ createdOn: 1});


// Create a "Task" model to be used in the database
const Task = mongoose.model("Task", taskSchema);


// -------------------------------------- TASK ROUTES --------------------------------------



// Get all the tasks
app.get("/tasks", async(req, res) => {
    try {

        const { sortBy } = req.query; // ?sortBy= dueDate or
        let sortOption = {};

        if (sortBy == "dueDate") {
            sortOption = { dueDate : 1}; // Ascending
        } else if (sortBy == "createdOn") {
            sortOption = { createdOn : 1}; // Ascending
        }
        const tasks = await Task.find({}).sort(sortOption);
        res.json(tasks);

    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({message: "Error grabbing tasks!"});
    }
});



// Create a new task and add it to the array
app.post("/tasks/todo", async (req,res) => {
    try {
        const { title, description, dueDate } = req.body;
        const taskData = {title, description, dueDate};
        const createTask = new Task(taskData);
        const newTask = await createTask.save();
        

        res.json({task: newTask, message: "New task created successfully!"});

    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({message: "Error creating the task!"});
    }
});


// to complete the task
app.patch("/tasks/complete/:id", async(req, res) => {
    try {
        const { completed } = req.body;
        const taskId = req.params.id;

        const completedTask = await Task.findByIdAndUpdate(taskId, { completed }, { new: true });

        if (!completedTask) {
            return res.status(404).json({ message: "Task not found!"});
        }

        res.json({ task: completedTask, message: "Task set to 'complete'"});

    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({message: "Error completing the task!"});
    }
});


// to NOT complete the task
app.patch("/tasks/notComplete/:id", async(req, res) => {
    try {
        const { completed } = req.body;
        const taskId = req.params.id;

        const taskNotComplete = await Task.findByIdAndUpdate(taskId, { completed }, { new: true });

        if (!taskNotComplete) {
            return res.status(404).json({ message: "Task not found!"});
        }

        res.json({ task: taskNotComplete, message: "Task set to 'not complete'"});

    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({message: "Error setting the task to 'not complete'!"});
    }
});

// To delete task
app.delete("/tasks/delete/:id", async (req, res) => {
    try {
        const taskId = req.params.id;

        const deletedTask = await Task.findByIdAndDelete(taskId);

        if (!deletedTask) {
            return res.status(404).json({message: "task not found!"});
        }

        res.json({ task: deletedTask, message: "Task deleted successfully" });

    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({message: "Error deleting the task!"});
        
    }
});

//To edit the task and change values
app.put("/tasks/update/:id", async (req, res) => {
    try {
        const taskId = req.params.id;
        const { title, description, dueDate } = req.body;

        const taskData = { title, description, dueDate };
        const updatedTask = await Task.findByIdAndUpdate(taskId, taskData, { new: true});

        if (!updatedTask) {
            return res.status(404).json({message: "task not found!"});
        }

        res.json({ task: updatedTask, message: "Task update successfully" });

    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({message: "Error editing the task!"});
    }
});