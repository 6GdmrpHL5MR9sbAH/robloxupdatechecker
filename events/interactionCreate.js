const { Client, Interaction } = require("discord.js")
const { readJSON, writeJSON, errorEmbed, successEmbed } = require("../functions")

async function commandHandler(client, interaction) {
    const command = client.commands.get(interaction.commandName)

    if (!command) return console.log(interaction, client.commands)

    const permission = command.permission || ""

    if (permission === "SERVER_OWNERS_ADMINS" && !interaction.member.permissions.has("ADMINISTRATOR")) {
        const embed = errorEmbed(interaction)
            .setDescription(`This command can only be used by this servers admins.`)
        return interaction.reply({ embeds: [embed], ephemeral: true })
    }

    try {
        if (!readJSON("guilds")[interaction.guild.id]) writeJSON("guilds", interaction.guild.id, {})

        command.execute(client, interaction)
    } catch (error) {
        console.log(`${error.stack || error}`.red)
        const embed = errorEmbed(interaction)
            .setDescription(`An error occurred while running this command.`)
        await interaction.reply({ embeds: [embed], ephemeral: true })
    }
}

async function toggleRole(roleId, interaction) {
    const member = interaction.member

    let gave = false

    if (member.roles.cache.has(roleId)) {
        member.roles.remove(roleId)
    } else {
        member.roles.add(roleId)
        gave = true
    }

    const embed = successEmbed()
        .setDescription(`${gave ? `You have been given ` : ""}<@&${roleId}>${gave ? "" : ` has been taken from you.`}`)

    await interaction.deferReply({ ephemeral: true })

    await interaction.editReply({ embeds: [embed] })
}

async function buttonHandler(interaction) {
    const guildData = readJSON("guilds")

    if (interaction.customId === "toggle update role") {
        if (!guildData[interaction.guild.id].updateRole || !interaction.guild.roles.cache.has(guildData[interaction.guild.id].updateRole)) {
            const embed = errorEmbed()
                .setDescription("This server doesn't have a valid update role setup.")

            await interaction.deferReply({ ephemeral: true })
            await interaction.editReply({ embeds: [embed] })
        }

        toggleRole(guildData[interaction.guild.id].updateRole, interaction)
    }

    oldButtonHandler(interaction)
}

async function oldButtonHandler(interaction) {
    const guildData = readJSON("guilds")

    switch (interaction.customId) {
        case "getUpdateRole":
            if (!guildData[interaction.guild.id].updateRole || !interaction.guild.roles.cache.has(guildData[interaction.guild.id].updateRole)) {
                const embed = errorEmbed()
                    .setDescription("This server doesn't have a valid update role setup.")

                await interaction.deferReply({ ephemeral: true })
                await interaction.editReply({ embeds: [embed] })
            } else if (interaction.member.roles.cache.has(guildData[interaction.guild.id].updateRole)) {
                const embed = errorEmbed()
                    .setDescription(`You already have <@&${guildData[interaction.guild.id].updateRole}>.`)

                await interaction.deferReply({ ephemeral: true })
                await interaction.editReply({ embeds: [embed] })
            } else {
                await interaction.member.roles.add(guildData[interaction.guild.id].updateRole)

                const embed = successEmbed()
                    .setDescription(`Got <@&${guildData[interaction.guild.id].updateRole}>.`)

                await interaction.deferReply({ ephemeral: true })
                await interaction.editReply({ embeds: [embed] })
            }
            break
        case "removeUpdateRole":
            if (!guildData[interaction.guild.id]["updateRole"] || !interaction.guild.roles.cache.has(guildData[interaction.guild.id].updateRole)) {
                const embed = errorEmbed()
                    .setDescription("This server doesn't have a valid update role setup.")

                await interaction.deferReply({ ephemeral: true })
                await interaction.editReply({ embeds: [embed] })
            } else if (!interaction.member.roles.cache.has(guildData[interaction.guild.id]["updateRole"])) {
                const embed = errorEmbed()
                    .setDescription(`You don't have <@&${guildData[interaction.guild.id].updateRole}>.`)

                await interaction.deferReply({ ephemeral: true })
                await interaction.editReply({ embeds: [embed] })
            } else {
                await interaction.member.roles.remove(guildData[interaction.guild.id].updateRole)

                const embed = successEmbed()
                    .setDescription(`Removed <@&${guildData[interaction.guild.id].updateRole}>.`)

                await interaction.deferReply({ ephemeral: true })
                await interaction.editReply({ embeds: [embed] })
            }
            break
    }
}

module.exports = {
    name: "interactionCreate",
    once: false,
    /**
     * @param {Client} client
     * @param {Interaction} interaction
     */
    async execute(client, interaction) {
        if (interaction.isApplicationCommand()) {
            commandHandler(client, interaction)
        }

        if (interaction.isButton()) {
            buttonHandler(interaction)
        }
    }
}