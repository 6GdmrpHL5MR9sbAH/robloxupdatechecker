// Log Joins \\

module.exports = {
    async execute(client, member) {
        if (member.guild.id === "836941787213725717" && !member.user.bot) {
            const embed = new Discord.MessageEmbed()
                .setColor("BLUE")
                .setDescription(`${member} has joined.`)
                .setAuthor(member.user.tag, member.user.displayAvatarURL({ dynamic: true }))
            member.guild.channels.cache.get("869013333158789150").send({ embeds: [embed] })
            member.roles.add("839572786120097792")
        }
    }
}