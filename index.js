// Uncomment "deploySlashCommands()" when you need to deploy the slash commands \\
// It's commented to avoid API spam and to avoid "Invalid interaction application command" \\

const Discord = require("discord.js")
const fs = require("fs")
const wait = require("util").promisify(setTimeout)
const fetch = require("node-fetch")
const puppeteer = require("puppeteer")
const config = require("./config.json")
const client = new Discord.Client({ intents: ["GUILDS", "GUILD_MEMBERS"] })
let rickRolling = false

// Generates a random number, used for the random rickroll status.
async function generateNumber(min, max) {
    return parseInt(Math.random() * (max - min + 1) + min)
}

// Write to JSON file.
async function writeJSON(jsonFileName, path, data, codeToRun) {
    const file = JSON.parse(fs.readFileSync(`./data/${jsonFileName}.json`, "utf8"))
    if (!codeToRun) codeToRun = "file[path] = data"
    eval(codeToRun)
    fs.writeFileSync(`./data/${jsonFileName}.json`, JSON.stringify(file, null, "\t"))
}

// Deploy global slash commands.
async function deploySlashCommands() {
    const data = [
        {
            name: "invite",
            description: "Sends the invite link for the bot and the main server."
        },
        {
            name: "setupdatechannel",
            description: "Sets the update channel to the provided channel - Requires the ADMINISTRATOR permission.",
            options: [
                {
                    name: "channel",
                    description: "The update channel.",
                    type: "CHANNEL",
                    required: true
                }
            ]
        },
        {
            name: "setupdaterole",
            description: "Sets the update mention role to the provided role - Requires the ADMINISTRATOR permission.",
            options: [
                {
                    name: "role",
                    description: "The update role.",
                    type: "ROLE",
                    required: true
                }
            ]
        },
        {
            name: "createrolemenu",
            description: "Creates a role menu for the update role - Requires the ADMINISTRATOR permission."
        }
    ]
    client.application.commands.set(data)
}

// Function for slash commands.
async function slashCommands(command, interaction) {
    if (!JSON.parse(fs.readFileSync("./data/guilds.json", "utf8"))[interaction.guild.id]) {
        await writeJSON("guilds", interaction.guild.id, {})
    }
    if (command === "invite") {
        const embed = new Discord.MessageEmbed()
            .setColor("BLUE")
            .setDescription(`[Click to invite the bot to your server](https://discord.com/api/oauth2/authorize?client_id=836942695842447361&permissions=8&scope=bot%20applications.commands)
[Click to join the RUC server](https://discord.gg/wHy6kkvDQc)`)
        await interaction.deferReply({ ephemeral: true })
        await interaction.editReply({ embeds: [embed] })
    } else if (command === "setupdatechannel") {
        let embed
        if (!interaction.member.permissions.has("ADMINISTRATOR")) {
            embed = new Discord.MessageEmbed()
                .setColor("RED")
                .setDescription("You need the `Administrator` permission to use this command.")
            await interaction.deferReply({ ephemeral: true })
        } else {
            await writeJSON("guilds", interaction.guild.id, interaction.options.getChannel("channel", true).id, `file[path]["updateChannel"]`)
            embed = new Discord.MessageEmbed()
                .setColor("BLUE")
                .setDescription(`The update channel is now <#${JSON.parse(fs.readFileSync("./data/guilds.json", "utf8"))[interaction.guild.id].updateChannel}>.`)
            await interaction.deferReply()
        }
        await interaction.editReply({ embeds: [embed] })
    } else if (command === "setupdaterole") {
        if (!interaction.member.permissions.has("ADMINISTRATOR")) {
            embed = new Discord.MessageEmbed()
                .setColor("RED")
                .setDescription("You need the `Administrator` permission to use this command.")
            await interaction.deferReply({ ephemeral: true })
        } else if (interaction.options.getRole("role", true) === interaction.guild.roles.everyone) {
            embed = new Discord.MessageEmbed()
                .setColor("RED")
                .setDescription("Invalid role.")
            await interaction.deferReply({ ephemeral: true })
        } else {
            await writeJSON("guilds", interaction.guild.id, interaction.options.getRole("role", true).id, `file[path]["updateRole"]`)
            embed = new Discord.MessageEmbed()
                .setColor("BLUE")
                .setDescription(`The update role is now <@&${JSON.parse(fs.readFileSync("./data/guilds.json", "utf8"))[interaction.guild.id].updateRole}>.`)
            await interaction.deferReply()
        }
        await interaction.editReply({ embeds: [embed] })
    } else if (command === "createrolemenu") {
        const row = new Discord.MessageActionRow()
            .addComponents(
                new Discord.MessageButton()
                    .setCustomId("getUpdateRole")
                    .setLabel("Get Role")
                    .setStyle("SUCCESS"),
                new Discord.MessageButton()
                    .setCustomId("removeUpdateRole")
                    .setLabel("Remove Role")
                    .setStyle("DANGER")
            )
        if (!interaction.member.permissions.has("ADMINISTRATOR")) {
            const embed = new Discord.MessageEmbed()
                .setColor("RED")
                .setDescription("You need the `Administrator` permission to use this command.")
            await interaction.deferReply({ ephemeral: true })
            await interaction.editReply({ embeds: [embed] })
        } else if (!JSON.parse(fs.readFileSync("./data/guilds.json", "utf8"))[interaction.guild.id].updateRole) {
            const embed = new Discord.MessageEmbed()
                .setColor("RED")
                .setDescription("An update role is required to use this. Use `/moderation setupdaterole`.")
            await interaction.deferReply({ ephemeral: true })
            await interaction.editReply({ embeds: [embed] })
        } else {
            const embed = new Discord.MessageEmbed()
                .setColor("BLUE")
                .setDescription(`Click "Get Role" to get <@&${JSON.parse(fs.readFileSync("./data/guilds.json", "utf8"))[interaction.guild.id].updateRole}>.
Click "Remove Role" to remove <@&${JSON.parse(fs.readFileSync("./data/guilds.json", "utf8"))[interaction.guild.id].updateRole}>.`)
                .setFooter("if it fails make sure the Roblox Update Checker bot is online.")
            await interaction.deferReply()
            await interaction.editReply({ embeds: [embed], components: [row] })
        }
    }
}

// Logs new update.
async function logVersion(version, release) {
    const versionData = JSON.parse(fs.readFileSync("./data/versions.json", "utf8"))
    const guildData = JSON.parse(fs.readFileSync("./data/guilds.json", "utf8"))
    const versionList = versionData.list
    const previous = versionData.current
    if (version === undefined || version === previous) {
        return
    }
    const embed = new Discord.MessageEmbed()
        .setColor("RED")
        .setTitle("Roblox Updated")
        .setDescription(`Sent <t:${parseInt((new Date().getTime() / 1000).toFixed(0))}:R>.`)
        .setFields(
            {
                name: "Previous Version",
                value: previous,
                inline: true
            },
            {
                name: "New Version",
                value: version,
                inline: true
            }
        )
    if (versionList.includes(version)) {
        embed.setColor("BLUE")
        embed.setTitle("Update Reverted")
        embed.setFields(
            {
                name: "Reverted From",
                value: previous,
                inline: true
            },
            {
                name: "Reverted To",
                value: version,
                inline: true
            }
        )
    }
    versionList.push(version)
    await writeJSON("versions", "current", version)
    await writeJSON("versions", "previous", previous)
    await writeJSON("versions", "list", versionList)
    client.guilds.cache.forEach(guild => {
        if (!guildData[guild.id] || !guildData[guild.id]["updateChannel"]) {
            return
        }
        const channel = client.channels.cache.get(guildData[guild.id].updateChannel)
        if (guildData[guild.id]["updateRole"]) {
            const content = `<@&${guildData[guild.id].updateRole}>`
            channel.send({ content: content, embeds: [embed] })
                .then(message => {
                    if (channel.type === "GUILD_NEWS") {
                        message.crosspost()
                    }
                })
        } else {
            channel.send({ embeds: [embed] })
                .then(message => {
                    if (channel.type === "GUILD_NEWS") {
                        message.crosspost()
                    }
                })
        }
    })
    getReleaseNotes(release)
}

// Gets the latest release notes.
async function getReleaseNotes(release, browser, page) {
    const guildData = JSON.parse(fs.readFileSync("./data/guilds.json", "utf8"))
    if (!browser) {
        browser = await puppeteer.launch({
            headless: true,
            args: ["--disk-cache-size=0"]
        })
        page = await browser.newPage()
    }
    await page.setCacheEnabled(false)
    try {
        await page.goto(`https://developer.roblox.com/en-us/resources/release-note/Release-Notes-for-${release}`)
        await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 })
        await page.waitForSelector("div[class=\"table-responsive\"]", { visible: true, timeout: 15000 })
    } catch (error) {
        return getReleaseNotes(release, browser, page)
    }
    const element = await page.$("body > div.main-container.generic-pages.sub-pages > div.container-fluid > div > main > div > div.page-elements > div:nth-child(2) > table")
    const box = await element.boundingBox()
    await element.screenshot({ path: `./releasenotes/${release}.png`, clip: { "x": box.x + 5, "y": box.y - 50, "width": box.width - 5, "height": box.height + 50 } })
    await browser.close()
    const file = new Discord.MessageAttachment(`./releasenotes/${release}.png`)
    const embed = new Discord.MessageEmbed()
        .setColor("BLUE")
        .setTitle("Release Notes")
        .setURL(`https://developer.roblox.com/en-us/resources/release-note/Release-Notes-for-${release}`)
        .setDescription(`The preview has been attached.
[Click here to view the full release notes.](https://developer.roblox.com/en-us/resources/release-note/Release-Notes-for-${release})
Sent <t:${parseInt((new Date().getTime() / 1000).toFixed(0))}:R>.`)
        .setImage(`attachment://${release}.png`)
    client.guilds.cache.forEach(guild => {
        if (!guildData[guild.id] || !guildData[guild.id]["updateChannel"]) return
        const channel = client.channels.cache.get(guildData[guild.id].updateChannel)
        channel.send({ embeds: [embed], files: [file] })
            .then(message => {
                if (channel.type === "GUILD_NEWS") {
                    message.crosspost()
                }
            })
    })
}

// Runs events in the /events/ folder.
for (const file of fs.readdirSync("./events").filter(file => file.endsWith(".js"))) {
    const event = require(`./events/${file}`)
    client.on(file.replace(".js", ""), (...args) => {
        event.execute(client, ...args)
    })
}

// After the bot logs in.
client.on("ready", async _ => {
    const config = JSON.parse(fs.readFileSync("./config.json", "utf8"))
    console.log(`${client.user.tag} is online`)
    setInterval(_ => {
        fetch("https://clientsettings.roblox.com/v2/client-version/WindowsPlayer")
            .then(response => response.json())
            .then(response => {
                if (response.clientVersionUpload) {
                    logVersion(response.clientVersionUpload, response.version.slice(2, -10))
                }
            })
            .catch(error => {
                // console.error(error) // Uncomment if you want to log errors.
            })
    }, 3000)
    // deploySlashCommands()
    setInterval(async _ => {
        if (rickRolling) return
        if (generateNumber(1, 1000) === 1) {
            rickRolling = true
            client.user.setPresence({ activities: [{ name: "Never gonna give you up." }], status: "dnd" })
            await wait(10000)
            client.user.setPresence({ activities: [{ name: "Never gonna let you down." }], status: "dnd" })
            await wait(10000)
            client.user.setPresence({ activities: [{ name: "Never gonna run around and desert you." }], status: "dnd" })
            await wait(10000)
            client.user.setPresence({ activities: [{ name: "Never gonna make you cry." }], status: "dnd" })
            await wait(10000)
            client.user.setPresence({ activities: [{ name: "Never gonna say goodbye." }], status: "dnd" })
            await wait(10000)
            client.user.setPresence({ activities: [{ name: "Never gonna tell a lie and hurt you." }], status: "dnd" })
            await wait(10000)
            rickRolling = false
        } else {
            client.user.setPresence({
                activities: [{
                    name: `${client.guilds.cache.size} server${client.guilds.cache.size === 1 ? "" : "s"} | Version ${config.version} | Ping: ${client.ws.ping}ms`,
                    type: "WATCHING"
                }],
                status: "dnd"
            })
        }
    }, 15000)
})

// Slash commands and buttons.
client.on("interactionCreate", async interaction => {
    const guildData = JSON.parse(fs.readFileSync("./data/guilds.json", "utf8"))
    if (interaction.isCommand()) { // Slash Commands
        if (interaction.commandName === "invite") slashCommands("invite", interaction) // /invite
        if (interaction.commandName === "setupdatechannel") slashCommands("setupdatechannel", interaction) // /setupdatechannel
        if (interaction.commandName === "setupdaterole") slashCommands("setupdaterole", interaction) // /setupdaterole
        if (interaction.commandName === "createrolemenu") slashCommands("createrolemenu", interaction) // /createrolemenu
    } else if (interaction.isButton()) { // Buttons
        if (interaction.customId === "getUpdateRole") { // Role Menu - Give Update Role
            if (!guildData[interaction.guild.id].updateRole || !interaction.guild.roles.cache.has(guildData[interaction.guild.id].updateRole)) {
                const embed = new Discord.MessageEmbed()
                    .setColor("RED")
                    .setDescription("This server doesn't have a valid update role setup.")
                await interaction.deferReply({ ephemeral: true })
                return interaction.editReply({ embeds: [embed] })
            } else if (interaction.member.roles.cache.has(guildData[interaction.guild.id].updateRole)) {
                const embed = new Discord.MessageEmbed()
                    .setColor("RED")
                    .setDescription(`You already have <@&${guildData[interaction.guild.id].updateRole}>.`)
                await interaction.deferReply({ ephemeral: true })
                return interaction.editReply({ embeds: [embed] })
            }
            await interaction.member.roles.add(guildData[interaction.guild.id].updateRole)
            const embed = new Discord.MessageEmbed()
                .setColor("BLUE")
                .setDescription(`Got <@&${guildData[interaction.guild.id].updateRole}>.`)
            await interaction.deferReply({ ephemeral: true })
            await interaction.editReply({ embeds: [embed] })
        }
        if (interaction.customId === "removeUpdateRole") { // Role Menu - Remove Update Role
            if (!guildData[interaction.guild.id]["updateRole"] || !interaction.guild.roles.cache.has(guildData[interaction.guild.id].updateRole)) {
                const embed = new Discord.MessageEmbed()
                    .setColor("RED")
                    .setDescription("This server doesn't have a valid update role setup.")
                await interaction.deferReply({ ephemeral: true })
                return interaction.editReply({ embeds: [embed] })
            } else if (!interaction.member.roles.cache.has(guildData[interaction.guild.id]["updateRole"])) {
                const embed = new Discord.MessageEmbed()
                    .setColor("RED")
                    .setDescription(`You don't have <@&${guildData[interaction.guild.id].updateRole}>.`)
                await interaction.deferReply({ ephemeral: true })
                return interaction.editReply({ embeds: [embed] })
            }
            await interaction.member.roles.remove(guildData[interaction.guild.id].updateRole)
            const embed = new Discord.MessageEmbed()
                .setColor("BLUE")
                .setDescription(`Removed <@&${guildData[interaction.guild.id].updateRole}>.`)
            await interaction.deferReply({ ephemeral: true })
            await interaction.editReply({ embeds: [embed] })
        }
    }
})

// Log uncaught errors.
process.on("uncaughtException", error => console.error(error))

// Login.
client.login(config.token)
