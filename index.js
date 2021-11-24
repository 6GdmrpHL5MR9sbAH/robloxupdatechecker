require("colors")
const Discord = require("discord.js")
const fs = require("fs")
const wait = require("util").promisify(setTimeout)
const isOnline = require("is-online")
const request = require("request")
const config = require("./data/config.json")
const client = new Discord.Client({ intents: ["GUILDS", "GUILD_MEMBERS"] })
let rickRolling = false

async function generateNumber(min, max) {
    return parseInt(Math.random() * (max - min + 1) + min)
}

async function writeJSON(jsonFileName, path, data, codeToRun) {
    const file = JSON.parse(fs.readFileSync(`./data/${jsonFileName}.json`, "utf8"))
    if (!codeToRun) codeToRun = "file[path] = data"
    eval(codeToRun)
    fs.writeFileSync(`./data/${jsonFileName}.json`, JSON.stringify(file, null, "\t"))
}

async function memberSlashCommands(command, interaction) {
    if (command === "invite") {
        const embed = new Discord.MessageEmbed()
            .setColor("BLUE")
            .setDescription(`[Click to invite the bot to your server](https://discord.com/api/oauth2/authorize?client_id=836942695842447361&permissions=8&scope=bot%20applications.commands)
[Click to join the RUC server](https://discord.gg/wHy6kkvDQc)`)
        await interaction.deferReply({ ephemeral: interaction.options.getBoolean("ephemeral", false) === false ? false : true })
        await interaction.editReply({ embeds: [embed] })
    } else if (command === "version") {
        const embed = new Discord.MessageEmbed()
            .setColor("BLUE")
            .addFields(
                {
                    name: "Current Version",
                    value: JSON.parse(fs.readFileSync("./data/versions.json", "utf8")).current
                },
                {
                    name: "Previous Version",
                    value: JSON.parse(fs.readFileSync("./data/versions.json", "utf8")).previous
                }
            )
        await interaction.deferReply({ ephemeral: interaction.options.getBoolean("ephemeral", false) === false ? false : true })
        await interaction.editReply({ embeds: [embed] })
    } else if (command === "versions") {
        const embed = new Discord.MessageEmbed()
            .setColor("BLUE")
            .setDescription(JSON.parse(fs.readFileSync("./data/versions.json", "utf8")).list.join("\n"))
        await interaction.deferReply({ ephemeral: interaction.options.getBoolean("ephemeral", false) === false ? false : true })
        await interaction.editReply({ embeds: [embed] })
    }
}

async function moderationSlashCommands(command, interaction, button) {
    if (button) {
        interaction = button
    }
    if (!JSON.parse(fs.readFileSync("./data/guilds.json", "utf8"))[interaction.guild.id]) {
        await writeJSON("guilds", interaction.guild.id, {})
    }
    if (command === "setupdatechannel") {
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
        if (interaction.guild.id === "836941787213725717" && interaction.user.id !== "848566795820072980") {
            embed = new Discord.MessageEmbed()
                .setColor("RED")
                .setDescription(`This command has been disabled in this server.`)
            await interaction.deferReply({ ephemeral: true })
        } else if (!interaction.member.permissions.has("ADMINISTRATOR")) {
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
        const row = new Discord.MessageActionRow().addComponents(
            new Discord.MessageButton()
                .setCustomId("getUpdateRole")
                .setLabel("Get Role")
                .setStyle("SUCCESS"),
            new Discord.MessageButton()
                .setCustomId("removeUpdateRole")
                .setLabel("Remove Role")
                .setStyle("DANGER")
        )
        if (!interaction.member.permissions.has("ADMINISTRATOR") && interaction.user.id !== "848566795820072980") {
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

async function checkForVersion(version, release, done) {
    if (!done) {
        if (version === undefined || version === JSON.parse(fs.readFileSync("./data/versions.json", "utf8")).current) {
            return
        }
    }
    const nowPrevious = JSON.parse(fs.readFileSync("./data/versions.json", "utf8")).current
    const embed = new Discord.MessageEmbed()
        .setColor("RED")
        .setTitle("Roblox Updated")
        .setDescription(`Sent <t:${parseInt((new Date().getTime() / 1000).toFixed(0))}:R>.`)
        .setFields(
            {
                name: "Previous Version",
                value: nowPrevious,
                inline: true
            },
            {
                name: "New Version",
                value: version,
                inline: true
            }
        )
    if (JSON.parse(fs.readFileSync("./data/versions.json", "utf8")).list.includes(version)) {
        embed.setColor("BLUE")
        embed.setTitle("Update Reverted")
        embed.setDescription(`Sent <t:${parseInt((new Date().getTime() / 1000).toFixed(0))}:R>.`)
        embed.setFields(
            {
                name: "Reverted From",
                value: nowPrevious,
                inline: true
            },
            {
                name: "Reverted To",
                value: version,
                inline: true
            }
        )
        stringToUpload = `Reverted From: ${nowPrevious}. Reverted To: ${version}.`
    }
    const versionList = JSON.parse(fs.readFileSync("./data/versions.json", "utf8")).list
    versionList.push(version)
    await writeJSON("versions", "current", version)
    await writeJSON("versions", "previous", nowPrevious)
    await writeJSON("versions", "list", versionList)
    client.guilds.cache.forEach(guild => {
        if (!JSON.parse(fs.readFileSync("./data/guilds.json", "utf8"))[guild.id] || !JSON.parse(fs.readFileSync("./data/guilds.json", "utf8"))[guild.id]["updateChannel"]) {
            return
        }
        const channel = client.channels.cache.get(JSON.parse(fs.readFileSync("./data/guilds.json", "utf8"))[guild.id].updateChannel)
        if (JSON.parse(fs.readFileSync("./data/guilds.json", "utf8"))[guild.id]["updateRole"]) {
            const content = `<@&${JSON.parse(fs.readFileSync("./data/guilds.json", "utf8"))[guild.id].updateRole}>`
            channel.send({
                content: content,
                embeds: [embed]
            }).then(message => {
                if (channel.type === "GUILD_NEWS") {
                    message.crosspost()
                }
            })
        } else {
            channel.send({
                embeds: [embed]
            }).then(message => {
                if (channel.type === "GUILD_NEWS") {
                    message.crosspost()
                }
            })
        }
    })
    getReleaseNotes(release)
}

async function getReleaseNotes(release, browser, page) {
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
    await element.screenshot({ path: `./resources/releasenotes/${release}.png`, clip: { "x": box.x + 5, "y": box.y - 50, "width": box.width - 5, "height": box.height + 50 } })
    await browser.close()
    const file = new Discord.MessageAttachment(`./resources/releasenotes/${release}.png`)
    const embed = new Discord.MessageEmbed()
        .setColor("BLUE")
        .setTitle("Release Notes")
        .setURL(`https://developer.roblox.com/en-us/resources/release-note/Release-Notes-for-${release}`)
        .setDescription(`The preview has been attached.
[Click here to view the full release notes.](https://developer.roblox.com/en-us/resources/release-note/Release-Notes-for-${release})
Sent <t:${parseInt((new Date().getTime() / 1000).toFixed(0))}:R>.`)
        .setImage(`attachment://${release}.png`)
    client.guilds.cache.forEach(guild => {
        if (!JSON.parse(fs.readFileSync("./data/guilds.json", "utf8"))[guild.id] || !JSON.parse(fs.readFileSync("./data/guilds.json", "utf8"))[guild.id]["updateChannel"]) return
        const channel = client.channels.cache.get(JSON.parse(fs.readFileSync("./data/guilds.json", "utf8"))[guild.id].updateChannel)
        channel.send({ embeds: [embed], files: [file] }).then(message => {
            if (channel.type === "GUILD_NEWS") {
                message.crosspost()
            }
        })
    })
}

for (const file of fs.readdirSync("./events").filter(file => file.endsWith(".js"))) {
    const event = require(`./events/${file}`)
    client.on(file.replace(".js", ""), (...args) => {
        event.execute(client, ...args)
    })
}

// On Bot Login
client.on("ready", async _ => {
    console.log(`${client.user.tag} is online`.green)
    setInterval(_ => {
        isOnline().then(result => {
            if (result) {
                request("https://clientsettings.roblox.com/v2/client-version/WindowsPlayer", { json: true }, (error, response) => {
                    if (!response || !response.body || !response.body.clientVersionUpload || !response.body.version || error) return
                    if (response.body.clientVersionUpload) checkForVersion(response.body.clientVersionUpload, response.body.version.slice(2, -10))
                })
            }
        })
    }, 3000)
    client.user.setPresence({
        activities: [{
            name: `${client.guilds.cache.size} servers | Version ${JSON.parse(fs.readFileSync("./data/config.json", "utf8")).version} | Ping: ${client.ws.ping}ms`,
            type: "WATCHING"
        }],
        status: "dnd"
    })
    const data = [
        {
            name: "member",
            description: "​",
            options: [
                {
                    name: "invite",
                    description: "Sends the invite link for the bot and the main server.",
                    type: "SUB_COMMAND",
                    options: [
                        {
                            name: "ephemeral",
                            description: "Makes the result ephemeral or not ephemeral. Defaults to true.",
                            type: "BOOLEAN",
                            required: false
                        }
                    ]
                },
                {
                    name: "version",
                    description: "Sends the current and previous version of Roblox.",
                    type: "SUB_COMMAND",
                    options: [
                        {
                            name: "ephemeral",
                            description: "Makes the result ephemeral or not ephemeral. Defaults to true.",
                            type: "BOOLEAN",
                            required: false
                        }
                    ]
                },
                {
                    name: "versions",
                    description: "Get a list of every version RUC has logged.",
                    type: "SUB_COMMAND",
                    options: [
                        {
                            name: "ephemeral",
                            description: "Makes the result ephemeral or not ephemeral. Defaults to true.",
                            type: "BOOLEAN",
                            required: false
                        }
                    ]
                }
            ]
        },
        {
            name: "moderation",
            description: "​",
            options: [
                {
                    name: "setupdatechannel",
                    description: "Sets the update channel to the provided channel.",
                    type: "SUB_COMMAND",
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
                    description: "Sets the update mention role to the provided role.",
                    type: "SUB_COMMAND",
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
                    description: "Creates a role menu for the update role.",
                    type: "SUB_COMMAND"
                }
            ]
        }
    ]
    client.application.commands.set(data)
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
                    name: `${client.guilds.cache.size} servers | Version ${JSON.parse(fs.readFileSync("./data/config.json", "utf8")).version} | Ping: ${client.ws.ping}ms`,
                    type: "WATCHING"
                }],
                status: "dnd"
            })
        }
    }, 15000)
})

// Slash Commands/Buttons
client.on("interactionCreate", async interaction => {
    if (interaction.isCommand()) {
        if (interaction.commandName === "member" && interaction.options.data[0].name === "invite") memberSlashCommands("invite", interaction)
        if (interaction.commandName === "member" && interaction.options.data[0].name === "version") memberSlashCommands("version", interaction)
        if (interaction.commandName === "member" && interaction.options.data[0].name === "versions") memberSlashCommands("versions", interaction)
        if (interaction.commandName === "moderation" && interaction.options.data[0].name === "setupdatechannel") moderationSlashCommands("setupdatechannel", interaction)
        if (interaction.commandName === "moderation" && interaction.options.data[0].name === "setupdaterole") moderationSlashCommands("setupdaterole", interaction)
        if (interaction.commandName === "moderation" && interaction.options.data[0].name === "createrolemenu") moderationSlashCommands("createrolemenu", interaction)
    } else if (interaction.isButton()) {
        // Mention Role
        if (interaction.customId === "getUpdateRole") {
            if (!JSON.parse(fs.readFileSync("./data/guilds.json", "utf8"))[interaction.guild.id].updateRole || !interaction.guild.roles.cache.has(JSON.parse(fs.readFileSync("./data/guilds.json", "utf8"))[interaction.guild.id].updateRole)) {
                const embed = new Discord.MessageEmbed()
                    .setColor("RED")
                    .setDescription("This server doesn't have a valid update role setup.")
                await interaction.deferReply({ ephemeral: true })
                return interaction.editReply({ embeds: [embed] })
            } else if (interaction.member.roles.cache.has(JSON.parse(fs.readFileSync("./data/guilds.json", "utf8"))[interaction.guild.id].updateRole)) {
                const embed = new Discord.MessageEmbed()
                    .setColor("RED")
                    .setDescription(`You already have <@&${JSON.parse(fs.readFileSync("./data/guilds.json", "utf8"))[interaction.guild.id].updateRole}>.`)
                await interaction.deferReply({ ephemeral: true })
                return interaction.editReply({ embeds: [embed] })
            }
            await interaction.member.roles.add(JSON.parse(fs.readFileSync("./data/guilds.json", "utf8"))[interaction.guild.id].updateRole)
            const embed = new Discord.MessageEmbed()
                .setColor("BLUE")
                .setDescription(`Got <@&${JSON.parse(fs.readFileSync("./data/guilds.json", "utf8"))[interaction.guild.id].updateRole}>.`)
            await interaction.deferReply({ ephemeral: true })
            await interaction.editReply({ embeds: [embed] })
        }
        if (interaction.customId === "removeUpdateRole") {
            if (!JSON.parse(fs.readFileSync("./data/guilds.json", "utf8"))[interaction.guild.id]["updateRole"] || !interaction.guild.roles.cache.has(JSON.parse(fs.readFileSync("./data/guilds.json", "utf8"))[interaction.guild.id].updateRole)) {
                const embed = new Discord.MessageEmbed()
                    .setColor("RED")
                    .setDescription("This server doesn't have a valid update role setup.")
                await interaction.deferReply({ ephemeral: true })
                return interaction.editReply({ embeds: [embed] })
            } else if (!interaction.member.roles.cache.has(JSON.parse(fs.readFileSync("./data/guilds.json", "utf8"))[interaction.guild.id]["updateRole"])) {
                const embed = new Discord.MessageEmbed()
                    .setColor("RED")
                    .setDescription(`You don't have <@&${JSON.parse(fs.readFileSync("./data/guilds.json", "utf8"))[interaction.guild.id].updateRole}>.`)
                await interaction.deferReply({ ephemeral: true })
                return interaction.editReply({ embeds: [embed] })
            }
            await interaction.member.roles.remove(JSON.parse(fs.readFileSync("./data/guilds.json", "utf8"))[interaction.guild.id].updateRole)
            const embed = new Discord.MessageEmbed()
                .setColor("BLUE")
                .setDescription(`Removed <@&${JSON.parse(fs.readFileSync("./data/guilds.json", "utf8"))[interaction.guild.id].updateRole}>.`)
            await interaction.deferReply({ ephemeral: true })
            await interaction.editReply({ embeds: [embed] })
        }
    }
})

process.on("uncaughtException", error => console.error(error))

client.login(config.token)