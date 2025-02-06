require('dotenv').config();
const express = require("express")
const http = require("http")
const CryptoJS = require("crypto-js");
// const path = require('path');
const app = express()
const server = http.createServer(app)
const io = require("socket.io")(server, {
	cors: {
		origin: process.env.CORS_ORIGIN,
		methods: [ "GET", "POST" ]
	}
})

const PASSWORD = process.env.ENCRYPTION_KEY; // Same password as frontend

function decryptData(encryptedData) {
    try {
        // Decrypt the data
        const bytes = CryptoJS.AES.decrypt(encryptedData, PASSWORD);
        // Convert to string and parse back to object
        const decrypted = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
        console.log('Decrypted data:', decrypted);
        return decrypted;
    } catch (error) {
        console.error('Decryption error:', error);
        return null;
    }
}
// app.use(express.static(path.join(__dirname, 'frontend/build')));

// // Handle React routing by returning index.html for all other routes
// app.get('*', (req, res) => {
//   res.sendFile(path.join(__dirname, 'frontend/build', 'index.html'));
// });

io.on("connection", (socket) => {
	socket.emit("me", socket.id)

	socket.on("disconnect", () => {
		socket.broadcast.emit("callEnded")
	})

	socket.on("callUser", (data) => {
	
		try {
            const decryptedData = decryptData(data.encryptedData);
            if (decryptedData) {
                io.to(decryptedData.userToCall).emit("callUser", {
                    signal: decryptedData.signalData,
                    from: decryptedData.from,
                    name: decryptedData.name
                });
            }
        } catch (error) {
            console.error("Error in callUser:", error);
        }
	})

	socket.on("answerCall", (data) => {
		io.to(data.to).emit("callAccepted", data.signal)
	})
})

server.listen(5000, () => console.log("server is running on port 5000"))
