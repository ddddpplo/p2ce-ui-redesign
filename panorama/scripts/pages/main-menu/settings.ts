'use strict';

class SettingsPage {
	/** @type {Panel} */
	content;
	/** @type {string} */
	name;
	/** @type {string} */
	layoutFile;
	
	constructor(content: Panel | null, name: string, layoutFile: string) {
		this.content = content;
		this.name = name;
		this.layoutFile = layoutFile;
	}
	
	hide() {
		this.content.SetHasClass('settings__contents--hidden', true);
	}
	
	show() {
		this.content.SetHasClass('settings__contents--hidden', false);
	}
}

class Settings {
    static panels = {
		cp: $.GetContextPanel(),
        categoriesContainer: $("#SettingsCategoriesContainer"),
		contentsContainer: $("#SettingsContentsContainer")
	};
    
    static pages = [
		new SettingsPage(null, "Video", "file://{resources}/layout/pages/main-menu/settings/video.xml"),
        new SettingsPage(null, "Audio", "file://{resources}/layout/pages/main-menu/settings/audio.xml"),
        new SettingsPage(null, "Controls", "file://{resources}/layout/pages/main-menu/settings/controls.xml"),
        new SettingsPage(null, "Interface", "file://{resources}/layout/pages/main-menu/settings/interface.xml"),
        new SettingsPage(null, "Customization", "file://{resources}/layout/pages/main-menu/settings/customization.xml")
	];
    
    static categoryButtons: TextButton[] = [];
    
    static currentPage: SettingsPage;
    
    static openPage(pageNum: int8) {
		let page = this.pages[pageNum];
        // add the selected class later
		if (!page || page === this.currentPage) {
			return;
		}
		
		if (page.content === null && this.panels.contentsContainer != null) {
			const newPanel = $.CreatePanel("Panel", this.panels.contentsContainer, page.name);
			newPanel.LoadLayout(page.layoutFile, false, false);
			newPanel.RegisterForReadyEvents(true);

			page.content = newPanel;
		}
        
        // currentPage might not yet be assigned if this is the first time openPage() is called, hence the question mark
		this.currentPage?.hide();
		page.show();
		this.currentPage = page;
        
        for (let i = 0; i < this.categoryButtons.length; i++) {
            if (i === pageNum) {
                this.categoryButtons[i].SetHasClass("settings__category--selected", true);
                this.categoryButtons[i].SetHasClass("grey-hover-button", false);
            } else {
                this.categoryButtons[i].SetHasClass("settings__category--selected", false);
                this.categoryButtons[i].SetHasClass("grey-hover-button", true);
            }
        }
	}
    
    static onLoaded() {
        if (!this.panels.categoriesContainer) {
			return;
		}
		for (let i = 0; i < this.pages.length; i++) {
			const categoryButton = $.CreatePanel("TextButton", this.panels.categoriesContainer, "");
			categoryButton.AddClass("settings__category");
			categoryButton.AddClass("grey-hover-button");
			categoryButton.SetPanelEvent('onactivate', () => this.openPage(i));
			
			let buttonLabel = categoryButton.GetFirstChild<Label>();
			if (buttonLabel) {
				buttonLabel.text = this.pages[i].name; // [TODO] add to lang file
			}
			this.categoryButtons.push(categoryButton);
		}
		
		this.openPage(0); // [TODO] might also be better to not hard code this later
    }
}