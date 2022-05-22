const { Client, Collection } = require("discord.js")
const { readdirSync } = require("fs")
const { TOKEN } = require("./config.json")
const client = new Client({ intents: ["GUILDS"] })

client.commands = new Collection()

readdirSync("./commands").forEach(file => {
    const command = require(`./commands/${file}`)

    client.commands.set(command.name, command)
})

readdirSync("./events").forEach(file => {
    const event = require(`./events/${file}`)

    if (event.once) {
        client.once(event.name, (...args) => event.execute(client, ...args))
    } else {
        client.on(event.name, (...args) => event.execute(client, ...args))
    }
})

process.on("uncaughtException", console.error)

client.login(TOKEN)

process.title = "RUC"