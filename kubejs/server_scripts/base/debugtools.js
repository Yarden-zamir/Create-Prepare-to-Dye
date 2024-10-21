// Priority: 1
ServerEvents.commandRegistry((event) => {
    const {
        commands: Commands,
        arguments: Arguments,
      } = event;
  event.register(
    Commands.literal("uuid").executes((context) => {
      let player = context.getSource().getPlayer();
      let playerUUID = player.uuid;
      let intArrays = global.minecraft.UUIDUtil.uuidToIntArray(playerUUID);
      player.tell(intArrays);
      return 0;
    })
  );
});
  event.register(
    Commands.literal("trading").executes((context) => {return 0})
    .then(Commands.literal("getPostageStamp").executes((context) => {
      let postageStamp = Item.of("ptdye:postage_stamp_transceiver");
      context.getSource().player.give(postageStamp);
      return 0;
    }))
    .then(Commands.literal("getTradingTransceiver").executes((context) => {
      let tradingTransceiver = Item.of("ptdye:trading_transceiver");
      context.getSource().player.give(tradingTransceiver);
      return 0;
    }))
    .then(Commands.literal("platform").executes((context) => {return 0})
    .then(Commands.literal("list").executes((context) => {
      //prints all trading platforms with ids and cordinates eg : "1: 78,11867"
      let existing_platforms_x = Utils.server.persistentData.getIntArray("existing_platforms_x");
      let existing_platforms_z = Utils.server.persistentData.getIntArray("existing_platforms_z");
      for (let index = 0; index < existing_platforms_x.length; index++) {
        let x = existing_platforms_x[index];
        let z = existing_platforms_z[index];
        context.getSource().player.tell(Text.of(index + ": " + x + "," + z));
      }
      return 0;

