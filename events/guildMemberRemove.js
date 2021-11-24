// Log Leaves \\
const Discord = require("discord.js")

module.exports = {
    async execute(client, member) {
        if (member.guild.id === "836941787213725717" && !member.user.bot) {
            const embed = new Discord.MessageEmbed()
                .setColor("RED")
                .setDescription(`${member} has left.`)
                .setAuthor(`${member.displayName} (${member.user.tag})`, member.user.displayAvatarURL({ dynamic: true }))
            member.guild.channels.cache.get("869013333158789150").send({ embeds: [embed] })
        }
    }
}