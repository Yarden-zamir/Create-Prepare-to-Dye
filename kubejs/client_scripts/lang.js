global.itemTooltips = [];

ClientEvents.lang("en_us", (event) => {
  global.itemTooltips.forEach((tooltipObject) => {
    let [id, tooltip] = tooltipObject;
    let item = Item.of(id);
    console.info(`adding ${tooltip} to ${item}`);
    event.add(`${item.getDescriptionId()}.tooltip.summary`, tooltip);
    event.add(`${item.getDescriptionId()}.emi.info`, tooltip.replace(/_/g,""));
  });
  let infoPages = {};
  Ingredient.all.itemIds.forEach((id) => {
    global.create.TooltipModifier.REGISTRY.registerDeferred(
      id,
      (item) => new global.create.ItemDescription(item, global.create.Palette.STANDARD_CREATE)
    );
    let key = Item.of(id).descriptionId+'.emi.info'
    if ((Text.translate(key).string!=key)){
      infoPages[id] = {
        type: "emi:info",
        stacks: [
          `item:${id}`
        ],
        text: key
      }
    }
  });
  for (let [key, value] of Object.entries(infoPages)) {
    JsonIO.write(`kubejs/assets/emi/recipe/additions/generated.${key.replace(':','.')}.json`, value);
  }
});
ClientEvents.lang("en_us", (event) => {
  //print all translation keys
  let allResources = [];
  event.map.keySet().forEach((key) => {
    let resource = {
      namespace: key.namespace(),
      key: key.key(),
    };
    allResources.push(resource);
    console.info("resource: " + JSON.stringify(resource));
  });
  JsonIO.write("kubejs/allEnglishTranslationKeys.json", {
    allResources: allResources,
  });
});

function genMissingTranslationsIndex(lang) {
  console.log("Generate missing translations index for" + lang);
  let namepsaces = JsonIO.read(
    "kubejs/translation_tools/allAssetNamespaces.json"
  ).namespaces; //reading namespaces list generated by listFoldersIntoJson.py (can also be done by hand)
  let all = {};
  for (let namespace of namepsaces) {
    let engLangFile = JsonIO.read(`kubejs/assets/${namespace}/lang/en_us.json`);
    let thisLangFile = JsonIO.read(
      `kubejs/assets/${namespace}/lang/${lang}.json`
    );

    if (!thisLangFile) {
      console.info(`no translation file for ${namespace}`);
    } else {
      thisLangFile.forEach((key, value) => {
        delete engLangFile[key]; //remove all keys that are already translated
      });
    }
    all[namespace] = sortObjectByKey(engLangFile);
  }
  JsonIO.write(
    `kubejs/translation_tools/missing_translations/${lang}.missing.json`,
    sortObjectByKey(all)
  );
}
JsonIO.read("kubejs/translation_tools/supported_langs.json").langs.forEach(
  (lang) => {
    console.log(`Subscribing lang ${lang} to missing translations index generation`);
    ClientEvents.lang(lang, (event) => genMissingTranslationsIndex(event.lang));
  }
);
