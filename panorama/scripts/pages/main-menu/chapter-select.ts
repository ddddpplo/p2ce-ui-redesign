'use strict';

const chapters = [
	"sp_a1_intro",
	"sp_a2_laser_intro",
	"sp_a2_bridge_intro",
	"sp_a2_column_blocker",
	"sp_a2_bts3",
	"sp_a3_00",
	"sp_a3_transition01",
	"sp_a4_intro",
	"sp_a4_finale1",
	"sp_a5_credits"
];

class ChapterSelect {
	static panels = {
		cp: $.GetContextPanel(),
		chapterNumberTitle: $<Label>('#ChapterNumberTitle'),
		chapterTitle: $<Label>('#ChapterTitle'),
		chapterThumbnail: $<Image>('#ChapterThumbnail'),
		chapterList: $<Panel>('#ChapterList')
	};
	
	// currentChapter is the chapter number it shows in game, NOT starting at 0
	static currentChapter: int8 = 1;
	static chapterButtons: TextButton[] = [];
	
	static clickChapterButton(chapterNum: int8) {
		if (!this.chapterButtons || this.chapterButtons[chapterNum - 1].HasClass("chapterselect__chapter-button--selected")) {
			return;
		}
		// make it white to show it's selected and remove the hover property
		this.chapterButtons[this.currentChapter - 1].SetHasClass("chapterselect__chapter-button--selected", false);
		this.chapterButtons[this.currentChapter - 1].SetHasClass("grey-hover-button", true);
		this.currentChapter = chapterNum;
		this.chapterButtons[this.currentChapter - 1].SetHasClass("chapterselect__chapter-button--selected", true);
		this.chapterButtons[this.currentChapter - 1].SetHasClass("grey-hover-button", false);
		
		if (this.panels.chapterTitle) {
			this.panels.chapterTitle.SetLocalizationString("#portal2_Chapter" + chapterNum + "_Subtitle");
			this.panels.chapterTitle.text = this.capitalizeTitle(this.panels.chapterTitle.text);
		}
		if (this.panels.chapterNumberTitle) {
			this.panels.chapterNumberTitle.text = "Chapter " + chapterNum + " • ";
		}
		if (this.panels.chapterThumbnail) {
			this.panels.chapterThumbnail.SetImage("file://{images}/menu/chapter_thumbnails/chapter" + chapterNum + ".png");
		}
	}
	
	static capitalizeTitle(str) {
		str = str.toLowerCase().split(" ");

		for (var i = 0, x = str.length; i < x; i++) {
			str[i] = str[i][0].toUpperCase() + str[i].substr(1);
		}
		return str.join(" ");
	}
	
	static onLoaded() {
		if (!this.panels.chapterList) {
			return;
		}
		for (let i = 0; i < chapters.length; i++) {
			const chapterButton = $.CreatePanel("TextButton", this.panels.chapterList, "ChapterButton" + (i + 1));
			chapterButton.AddClass("chapterselect__chapter-button");
			chapterButton.AddClass("grey-hover-button");
			chapterButton.SetPanelEvent('onactivate', () => this.clickChapterButton(i + 1));
			
			let chapterButtonLabel = chapterButton.GetFirstChild<Label>();
			if (chapterButtonLabel) {
				chapterButtonLabel.SetLocalizationString("#portal2_Chapter" + (i + 1) + "_Subtitle");
				chapterButtonLabel.text = this.capitalizeTitle(chapterButtonLabel.text);
			}
			this.chapterButtons.push(chapterButton);
		}
		
		if (this.chapterButtons.length > 0) {
			this.clickChapterButton(1);
		}
	}
	
	static playGame() {
		GameInterfaceAPI.ConsoleCommand('map ' + chapters[this.currentChapter - 1]);
		$.DispatchEvent('NavigateHome');
	}
}