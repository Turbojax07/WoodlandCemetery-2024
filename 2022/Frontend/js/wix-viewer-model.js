async function loadWixViewerModel() {
    window.viewerModel = await fetch("/json/wix-viewer-model.json")
        .then(resp => {return resp.ok ? resp.json() : `[${resp.status}] ${resp.statusText}`})
        .catch(err => {return err.message});

    var micModel = await fetch(window.viewerModel.dynamicModelUrl, {credentials: 'same-origin'})
        .then(resp => {return resp.ok ? resp.json() : `[${resp.status}] ${resp.statusText}`})
        .catch(err => {return err.message;});

    window.commonConfig = viewerModel.commonConfig;
}