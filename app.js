const { Client, MessageMedia, LocalAuth } = require("whatsapp-web.js");
const express = require("express");
const { body, validationResult } = require("express-validator");
const socketIO = require("socket.io");
const qrcode = require("qrcode");
const http = require("http");
const fs = require("fs");
const { phoneNumberFormatter } = require("./helpers/formatter");
const axios = require("axios");
const mime = require("mime-types");
const path = require("path");
const multer = require("multer");
const { v4: uuidv4 } = require("uuid");

const filesPayloadExists = require("./middleware/filesPayloadsExists");
const fileExtLimiter = require("./middleware/fileExtLimiter");
const fileSizeLimiter = require("./middleware/fileSizeLimiter");
const vpointAPI = require("./repository/vpointdata");

const port = process.env.PORT || 9000;

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  allowEIO3: true, // false by default
});
// menentukan lokasi pengunggahan
const diskStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "uploads"));
  },
  filename: function (req, file, cb) {
    const guid = uuidv4();
    cb(
      null,
      formatDate(Date.now()) + "_" + guid + path.extname(file.originalname)
    );
  },
});

function formatDate(date) {
  // Konversi string menjadi objek Date
  const currentDate = new Date(date);

  const year = currentDate.getFullYear();
  const month = String(currentDate.getMonth() + 1).padStart(2, "0");
  const day = String(currentDate.getMonth()).padStart(2, "0");
  const hours = String(currentDate.getHours()).padStart(2, "0");
  const minutes = String(currentDate.getMinutes()).padStart(2, "0");
  const seconds = String(currentDate.getSeconds()).padStart(2, "0");

  return `${year}${month}${day}${hours}${minutes}${seconds}`;
}
app.use(express.json());
app.use(
  express.urlencoded({
    extended: true,
  })
);

/**
 * BASED ON MANY QUESTIONS
 * Actually ready mentioned on the tutorials
 *
 * Many people confused about the warning for file-upload
 * So, we just disabling the debug for simplicity.
 */
// app.use(
//   fileUpload({
//     debug: false,
//   })
// );

app.get("/", (req, res) => {
  res.sendFile("index.html", {
    root: __dirname,
  });
});

const client = new Client({
  webVersionCache: {
    type: "remote",
    remotePath:
      "https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html",
  },
  restartOnAuthFail: true,
  puppeteer: {
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-accelerated-2d-canvas",
      "--no-first-run",
      "--no-zygote",
      "--single-process", // <- this one doesn't works in Windows
      "--disable-gpu",
    ],
  },
  authStrategy: new LocalAuth(),
});

client.initialize();

client.on("message", (msg) => {
  if (msg.body == "!ping") {
    msg.reply("pong");
    // } else if (msg.body == "good morning") {
    //   msg.reply("selamat pagi");
    // } else if (msg.body == "good afternoon" || msg.body == "good sore") {
    //   msg.reply("selamat siang");
    // } else if (msg.body == "good evening" || msg.body == "good night") {
    //   msg.reply("selamat malam");
  } else if (
    msg.body.toLowerCase() == "cek poin" ||
    msg.body.toLowerCase() == "info poin" ||
    msg.body.toLowerCase() == "check point" ||
    msg.body.toLowerCase() == "info point"
  ) {
    var result = vpointAPI.saldoPoin(msg);
    msg.reply(result);
  } else if (
    msg.body.toLowerCase() == "histori poin" ||
    msg.body.toLowerCase() == "history point"
  ) {
    var result = vpointAPI.historyPoin(msg);
    msg.reply(result);
  } else if (msg.body.toLowerCase() == "info promo") {
    var result = vpointAPI.infoPromo(msg);
    msg.reply(result);
    // } else if (msg.body == "!groups") {
    //   client.getChats().then((chats) => {
    //     const groups = chats.filter((chat) => chat.isGroup);

    //     if (groups.length == 0) {
    //       msg.reply("You have no group yet.");
    //     } else {
    //       let replyMsg = "*YOUR GROUPS*\n\n";
    //       groups.forEach((group, i) => {
    //         replyMsg += `ID: ${group.id._serialized}\nName: ${group.name}\n\n`;
    //       });
    //       replyMsg +=
    //         "_You can use the group id to send a message to the group._";
    //       msg.reply(replyMsg);
    //     }
    //   });
  } else {
    let replyMsg =
      "Selamat datang di *VPoint Mart*\nBelanja Murah belanja Mudah dan dapatkan keutamaan menjadi Member";
    client.sendMessage(msg.from, replyMsg);

    let button = new Buttons(
      "Button body",
      [{ body: "bt1" }, { body: "bt2" }, { body: "bt3" }],
      "title",
      "footer"
    );
    client.sendMessage(msg.from, button);
    let sections = [
      {
        title: "sectionTitle",
        rows: [
          { title: "ListItem1", description: "desc" },
          { title: "ListItem2" },
        ],
      },
    ];
    let list = new List("List body", "btnText", sections, "Title", "footer");
    client.sendMessage(msg.from, list);
  }

  // NOTE!
  // UNCOMMENT THE SCRIPT BELOW IF YOU WANT TO SAVE THE MESSAGE MEDIA FILES
  // Downloading media
  // if (msg.hasMedia) {
  //   msg.downloadMedia().then(media => {
  //     // To better understanding
  //     // Please look at the console what data we get
  //     console.log(media);

  //     if (media) {
  //       // The folder to store: change as you want!
  //       // Create if not exists
  //       const mediaPath = './downloaded-media/';

  //       if (!fs.existsSync(mediaPath)) {
  //         fs.mkdirSync(mediaPath);
  //       }

  //       // Get the file extension by mime-type
  //       const extension = mime.extension(media.mimetype);

  //       // Filename: change as you want!
  //       // I will use the time for this example
  //       // Why not use media.filename? Because the value is not certain exists
  //       const filename = new Date().getTime();

  //       const fullFilename = mediaPath + filename + '.' + extension;

  //       // Save to file
  //       try {
  //         fs.writeFileSync(fullFilename, media.data, { encoding: 'base64' });
  //         console.log('File downloaded successfully!', fullFilename);
  //       } catch (err) {
  //         console.log('Failed to save the file:', err);
  //       }
  //     }
  //   });
  // }
});

// Socket IO
io.on("connection", function (socket) {
  socket.emit("message", "Connecting...");

  client.on("qr", (qr) => {
    console.log("QR RECEIVED", qr);
    qrcode.toDataURL(qr, (err, url) => {
      socket.emit("qr", url);
      socket.emit("message", "QR Code received, scan please!");
    });
  });

  client.on("ready", () => {
    socket.emit("ready", "Whatsapp is ready!");
    socket.emit("message", "Whatsapp is ready!");
  });

  client.on("authenticated", () => {
    socket.emit("authenticated", "Whatsapp is authenticated!");
    socket.emit("message", "Whatsapp is authenticated!");
    console.log("AUTHENTICATED");
  });

  client.on("auth_failure", function (session) {
    socket.emit("message", "Auth failure, restarting...");
  });

  client.on("disconnected", (reason) => {
    socket.emit("message", "Whatsapp is disconnected!");
    client.destroy();
    client.initialize();
  });
});

const checkRegisteredNumber = async function (number) {
  const isRegistered = await client.isRegisteredUser(number);
  return isRegistered;
};

// Send message
app.post(
  "/send-message",
  [body("number").notEmpty(), body("message").notEmpty()],
  async (req, res) => {
    const errors = validationResult(req).formatWith(({ msg }) => {
      return msg;
    });

    if (!errors.isEmpty()) {
      return res.status(422).json({
        status: false,
        message: errors.mapped(),
      });
    }

    const number = phoneNumberFormatter(req.body.number);
    const message = req.body.message;

    const isRegisteredNumber = await checkRegisteredNumber(number);

    if (!isRegisteredNumber) {
      return res.status(422).json({
        status: false,
        message: "The number is not registered",
      });
    }

    client
      .sendMessage(number, message)
      .then((response) => {
        res.status(200).json({
          status: true,
          response: response,
        });
      })
      .catch((err) => {
        res.status(500).json({
          status: false,
          response: err,
        });
      });
  }
);

// Send media upload
app.post(
  "/send-media-upload",
  multer({ storage: diskStorage }).single("file"),
  async (req, res) => {
    try {
      const number = phoneNumberFormatter(req.body.number);
      const caption = req.body.caption;
      const file = req.file; // File yang diunggah

      if (!file) {
        return res.status(400).json({
          status: false,
          message: "No file uploaded",
        });
      }

      console.log("Number : " + number);
      console.log("Caption : " + caption);
      console.log("Filename : " + file.path);
      console.log("Original Name : " + file.originalname);

      const media = MessageMedia.fromFilePath(file.path);
      // const media = new MessageMedia(
      //   file.mimetype,
      //   fs.readFileSync(file.path),
      //   file.originalname
      // );
      console.log("Media MimeType : " + media.mimetype);
      client
        .sendMessage(number, media, {
          caption: caption,
        })
        .then((response) => {
          // Hapus file yang diunggah setelah berhasil dikirim
          fs.unlinkSync(file.path);
          res.status(200).json({
            status: true,
            response: response,
          });
        })
        .catch((err) => {
          // Hapus file yang diunggah setelah berhasil dikirim
          fs.unlinkSync(file.path);
          res.status(500).json({
            status: false,
            response: err,
            message: "Failed Send Media!",
          });
        });
    } catch (err) {
      return res.status(500).json({
        status: false,
        response: err,
      });
    }
  }
);

// Send media
app.post("/send-media", async (req, res) => {
  const number = phoneNumberFormatter(req.body.number);
  const caption = req.body.caption;
  const fileUrl = req.body.file;

  // const media = MessageMedia.fromFilePath('./image-example.png');
  // const file = req.files.file;
  // const media = new MessageMedia(file.mimetype, file.data.toString('base64'), file.name);
  let mimetype;
  const attachment = await axios
    .get(fileUrl, {
      responseType: "arraybuffer",
    })
    .then((response) => {
      mimetype = response.headers["content-type"];
      return response.data.toString("base64");
    });

  const media = new MessageMedia(mimetype, attachment, "Media");

  client
    .sendMessage(number, media, {
      caption: caption,
    })
    .then((response) => {
      res.status(200).json({
        status: true,
        response: response,
      });
    })
    .catch((err) => {
      res.status(500).json({
        status: false,
        response: err,
      });
    });
});

const findGroupByName = async function (name) {
  const group = await client.getChats().then((chats) => {
    return chats.find(
      (chat) => chat.isGroup && chat.name.toLowerCase() == name.toLowerCase()
    );
  });
  return group;
};

// Send message to group
// You can use chatID or group name, yea!
app.post(
  "/send-group-message",
  [
    body("id").custom((value, { req }) => {
      if (!value && !req.body.name) {
        throw new Error("Invalid value, you can use `id` or `name`");
      }
      return true;
    }),
    body("message").notEmpty(),
  ],
  async (req, res) => {
    const errors = validationResult(req).formatWith(({ msg }) => {
      return msg;
    });

    if (!errors.isEmpty()) {
      return res.status(422).json({
        status: false,
        message: errors.mapped(),
      });
    }

    let chatId = req.body.id;
    const groupName = req.body.name;
    const message = req.body.message;

    // Find the group by name
    if (!chatId) {
      const group = await findGroupByName(groupName);
      if (!group) {
        return res.status(422).json({
          status: false,
          message: "No group found with name: " + groupName,
        });
      }
      chatId = group.id._serialized;
    }

    client
      .sendMessage(chatId, message)
      .then((response) => {
        res.status(200).json({
          status: true,
          response: response,
        });
      })
      .catch((err) => {
        res.status(500).json({
          status: false,
          response: err,
        });
      });
  }
);

// Clearing message on spesific chat
app.post("/clear-message", [body("number").notEmpty()], async (req, res) => {
  const errors = validationResult(req).formatWith(({ msg }) => {
    return msg;
  });

  if (!errors.isEmpty()) {
    return res.status(422).json({
      status: false,
      message: errors.mapped(),
    });
  }

  const number = phoneNumberFormatter(req.body.number);

  const isRegisteredNumber = await checkRegisteredNumber(number);

  if (!isRegisteredNumber) {
    return res.status(422).json({
      status: false,
      message: "The number is not registered",
    });
  }

  const chat = await client.getChatById(number);

  chat
    .clearMessages()
    .then((status) => {
      res.status(200).json({
        status: true,
        response: status,
      });
    })
    .catch((err) => {
      res.status(500).json({
        status: false,
        response: err,
      });
    });
});

server.listen(port, function () {
  console.log("App running on *: " + port);
});
