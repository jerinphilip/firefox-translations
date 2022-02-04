console.log('mediator.js started');

const PRIORITIES = {
    'viewportNodeMap': 1,
    'nonviewportNodeMap': 2,
    'hiddenNodeMap': 3
};

const backgroundScript = browser.runtime.connect({name: 'content-script'});

// Todo rewrite this
const model = {};

const inPageTranslation = new InPageTranslation({
    contentScriptsMessageListener: (sender, {command, payload}) => {
        console.assert(command == 'translate');

        backgroundScript.postMessage({
            command: "TranslateRequest",
            data: {
                // translation request
                from: model.from,
                to: model.to,
                html: true,
                text: payload.text,
                
                // data useful for the scheduling
                priority: PRIORITIES[payload.attrId[0]],

                // data useful for the response
                user: {
                    type: payload.type,
                    attrId: payload.attrId
                }
            }
        });
    }
});

backgroundScript.onMessage.addListener(({command, data}) => {
    switch (command) {
        case "TranslateResponse":
            inPageTranslation.mediatorNotification({
                ...data.request.user,
                translatedParagraph: data.translation
            });
            break;
        case "TranslateStart":
            model.from = data.from;
            model.to = data.to;
            inPageTranslation.start();
            break;
    }
});

// request the language detection class to extract a page's snippet
const languageDetection = new LanguageDetection();
const sample = languageDetection.extractPageContent();

// Once we have the snippet, send it to background script for analysis
// and possibly further action (like showing the popup)
backgroundScript.postMessage({
    command: "DetectLanguage",
    data: {sample}
});