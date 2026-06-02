        currentStep++;
        try {
          updateWizardUI();
        } catch(e) {
          document.body.innerHTML += '<div style="position:fixed; top:0; left:0; z-index:99999; background:red; color:white; font-size: 20px; padding: 20px;">' + e.stack + '</div>';
        }
