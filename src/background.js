try {

    async function createOffscreen(){
        if(await chrome.offscreen.hasDocument()) return;

        await chrome.offscreen.createDocument({
            url: "offscreen.html",
            reasons: ["WORKERS"],
            justification: "Perform OCR"
        });
    }


    chrome.runtime.onMessage.addListener(function (request, _, response) {

        if(request.type === "startOCR") {

            (async () => {
                try {
                    await createOffscreen();
                    const text = await new Promise((resolve) => {
                        chrome.runtime.sendMessage(
                        {
                            message: "analyze",
                            image: request.image,
                            offscreen: true,  
                        },
                        (response) => {
                            resolve(response);
                        }
                    );
                 });
    
                 console.log("BG: ", text);
                 response(text);
                
                } catch (error) {
                    console.error(error);
                    response(null);
                }
            })();
    
            return true;
        }

    });

    chrome.runtime.onInstalled.addListener(() => {

        console.log("Extention Installed");
    })

    
} catch(err) {

    console.log(err);
}