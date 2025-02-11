// priority: 100
global.allAgreements = [];
const sealsThatHaveTextures = [
  // add entries to this list when you add textures for the companies
  "magical_landscaping_co",
  "black_hole_bagels_llc",
  "boards_and_wires",
  "bobs_construction_fleet",
  "interstellar_livestock_logistics",
  "qube",
  "stellar_sigil_syndicate",
  "cosmic_cuisine_collective",
  "galactic_beast_deliveries",
];

const wares_advancementTemplate = {
  parent: "ptd:trade/root",
  criteria: {
    a: {
      trigger: "minecraft:inventory_changed",
      conditions: {
        items: [ {
          items: ["wares:completed_delivery_agreement"],
          nbt: ""
        } ]
      }
    },
    b: {
      trigger: "wares:agreement_completed",
      conditions: { 
          agreementNbt: ""
        }
    }
  },
  requirements: [ [ "a", "b" ] ] // a or b
}

function getAgreementAdvancement(agreementID) {
  if (agreementID == "root")
    console.error("Cannot have a trade agreement with the id of 'root'");

  // Create advancement
  var advancement = Object.assign({ }, wares_advancementTemplate)
  advancement.criteria["a"].conditions.items[0].nbt = `{id:"${agreementID}", isCompleted:1b}`
  advancement.criteria["b"].conditions.agreementNbt = `{id:"${agreementID}"}`

  // Write advancement
  JsonIO.write(`kubejs/data/ptd/advancements/trade/${agreementID.toLowerCase()}.json`, advancement);
}

function getAgreement(agreementID, {
  paymentItems,
  requestedItems,
  title,
  orderedAmount,
  company,
  message,
}) {
  if (orderedAmount === null || orderedAmount === undefined)
    orderedAmount = parseInt(1);
  message = message.replaceAll("'", ""); // remove single quotes from messages
  let seal = sealsThatHaveTextures.includes(company) ? company : "default";
  let companyTitle = Utils.snakeCaseToTitleCase(company);

  let agreementObj = {
    item: Item.of("wares:delivery_agreement", {
      id: agreementID,
      revision: global.revision,
      ordered: orderedAmount,
      message: NBT.stringTag(`{"text":"${message}"}`),
      seal: seal,
      buyerName: { color: "#409D9B", text: companyTitle },
      paymentItems: simple(paymentItems),
      requestedItems: simple(requestedItems, true),
      title: NBT.stringTag(`{"text":"${title}"}`),
    }).withName(Text.gold(companyTitle + " - " + title).italic(false)),

    completedItem: Item.of("wares:completed_delivery_agreement", {
      id: agreementID,
      revision: global.revision,
      ordered: NBT.intTag(orderedAmount),
      buyerName: { color: "#409D9B", text: companyTitle },
      delivered: NBT.intTag(orderedAmount),
      isCompleted: NBT.b(1),
      message: NBT.stringTag(`{"text":"${message}"}`),
      seal: seal,
      paymentItems: simple(paymentItems),
      requestedItems: simple(requestedItems),
      title: NBT.stringTag(`{"text":"${title}"}`),
    }).withName(Text.gold(companyTitle + " - " + title).italic(false)),
  };
  global.allAgreements = global.allAgreements
    .filter((f) => f.nbt !== agreementObj.item.nbt)
    .concat([agreementObj.item]);
  if (orderedAmount != 0){
    global.allAgreements = global.allAgreements
      .filter((f) => f.nbt !== agreementObj.completedItem.nbt)
    .concat([agreementObj.completedItem]);
    let strippedCompletedItem = Item.of(agreementObj.completedItem.id).withNBT({"id": agreementID, "ordered": orderedAmount}).withName(Text.gold(companyTitle + " - " + title).italic(false));
    paymentItems.unshift(strippedCompletedItem)        
  }
  requestedItems.unshift(Item.of(agreementObj.item.id).withNBT({"id": agreementID, "ordered": orderedAmount}).withName(Text.gold(companyTitle + " - " + title).italic(false)))
  addFakeTradeItemsRecipe(paymentItems, requestedItems, 'wares:delivery_table');
  getAgreementAdvancement(agreementID)

  return agreementObj;
}
function simple(items, weaknbt) {
  weaknbt = weaknbt || false;
  if (!Array.isArray(items)) items = [items];
  return items.map((item_obj) => {
    let item = item_obj;
    if (typeof item_obj === "string") {
      item = Item.of(item);
    }
    let nbt = item.toNBT();
    nbt.Count = item.count;
    if (typeof item_obj === "string" && item_obj.includes("#")) {
      delete nbt.tag;
      //support for tags
      if (item_obj.includes("x ")) item_obj = item_obj.split("x ")[1];
      let tag = (
        Ingredient.of(item_obj).values[0].serialize().get("tag") + ""
      ).replaceAll('"', "");
      nbt.id = `#${tag}`;
    }
    if (weaknbt) nbt.TagMatching = "weak";
    return nbt;
  });
}

function tradeBranch(outputTrades, inputTrades) {
  if (!Array.isArray(outputTrades)) outputTrades = [outputTrades];
  if (!Array.isArray(inputTrades)) inputTrades = [inputTrades];
  if (inputTrades.length == 1) {
    inputTrades.push({ completedItem: Item.of("create:iron_sheet") });
  }
  ServerEvents.recipes((e) => {
    e.recipes.create.mixing(
      outputTrades.map((trade) => trade.item),
      inputTrades.map((trade) => getTradeNbtIdFilter(trade.completedItem))
    );
    // addTradeBlendingRecipe(
    //   outputTrades.map((trade) => trade.item),
    //   inputTrades.map((trade) => getTradeNbtNameFilter(trade.completedItem))
    // );

    let hiddenUniversalRecipe = e.recipes.create.mixing(
      outputTrades.map((trade) => trade.item),
      inputTrades.map((trade) => getTradeNbtIdFilter(trade.completedItem, true))
    );
    let random_string_id_10_chars= Math.random().toString(36).substring(7);
    hiddenUniversalRecipe.id = random_string_id_10_chars + "/hidden";
    
  });
}
function getTradeNbtIdFilter(item, compat) {
  if (!item.getNbt()) return item.weakNBT();
  if (item.nbt.get("id") == null) return item.weakNBT();
  if (compat) return Item.of(item.id).withNBT({"id": item.nbt.get("id")}).weakNBT();
  return Item.of(item.id).withNBT({
    "id": item.nbt.get("id"), 'ordered': item.nbt.get("ordered"), "display": item.nbt.get("display")
  }).weakNBT();
}
console.info("Loading wares manager");
ServerEvents.lowPriorityData((event) => {
  let obj = {
    added: [],
  };
  global.allAgreements.forEach((item) => {
    obj.added.push({
      stack: `item:${item.id}${item.nbt}`,
    });
  });

  JsonIO.write("kubejs/assets/emi/index/stacks/added_agreements.json", obj);
});
