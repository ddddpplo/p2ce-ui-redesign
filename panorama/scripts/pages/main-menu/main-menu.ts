'use strict';

class Page {
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
		this.content.SetHasClass('menu-page--hidden', true);
		this.content.SetHasClass('menu-page--shown', false);
	}
	
	show() {
		this.content.SetHasClass('menu-page--hidden', false);
		this.content.SetHasClass('menu-page--shown', true);
	}
}

class MainMenu {
	static panels = {
		cp: $.GetContextPanel(),
		homeContent: $('#HomeContent'),
		contentBlur: $('#MainMenuContentBlur'),
		backgroundBlur: $('#MainMenuBackgroundBlur'),
		movie: $<Movie>('#MainMenuMovie'),
		image: $<Image>('#MainMenuBackground'),
		mainMenuNavlist: $<Panel>('#MainMenuNavlist'),
		pageBlur: $<BaseBlurTarget>('#MainMenuPageBlur'),
		pagesContainer: $<Panel>('#MainMenuPagesContainer')
	};
	
	static pages = {
		'navlist': 			new Page(this.panels.mainMenuNavlist, "navlist", ""),
		'chapter-select': 	new Page(null, "chapter-select", "file://{resources}/layout/pages/main-menu/chapter-select.xml"),
		'settings': 		new Page(null, "settings", "file://{resources}/layout/pages/main-menu/settings.xml")
	};
	
	static currentPage: Page = this.pages.navlist;
	static pageHistory: Page[] = [];
	
	static {
		$.RegisterForUnhandledEvent('ShowMainMenu', this.onShowMainMenu.bind(this));
		$.RegisterForUnhandledEvent('HideMainMenu', this.onHideMainMenu.bind(this));
		$.RegisterForUnhandledEvent('ShowPauseMenu', this.onShowPauseMenu.bind(this));
		$.RegisterForUnhandledEvent('HidePauseMenu', this.onHidePauseMenu.bind(this));
		$.RegisterForUnhandledEvent('ReloadBackground', this.setMainMenuBackground.bind(this));
		$.RegisterEventHandler('Cancelled', $.GetContextPanel(), this.onEscapeKeyPressed.bind(this));
		$.RegisterForUnhandledEvent('MapLoaded', this.onBackgroundMapLoaded.bind(this));
		$.RegisterForUnhandledEvent('MapUnloaded', this.onMapUnloaded.bind(this));
		$.RegisterForUnhandledEvent('NavigateBack', this.onBackButtonPressed.bind(this));
		$.RegisterForUnhandledEvent('NavigateHome', this.navigateHome.bind(this));
		$.RegisterForUnhandledEvent('OpenPage', (pageName) => this.openPage(pageName));

		$.DispatchEvent('HideIntroMovie');
	}

	/**
	 * General onLoad initialisations.
	 * Fired when MainMenu fires its onload event.
	 */
	static onMainMenuLoaded() {	
		this.panels.movie = $<Movie>('#MainMenuMovie')
		this.setMainMenuBackground();

		if (GameStateAPI.IsPlaytest()) this.showPlaytestConsentPopup();
	}

	/**
	 * Shows playtest consent form
	 */
	static showPlaytestConsentPopup() {
		if (!DosaHandler.checkDosa('playtestConsent'))
			UiToolkitAPI.ShowCustomLayoutPopupParameters(
				'',
				'file://{resources}/layout/modals/popups/playtest-consent.xml',
				'dosaKey=playtestConsent&dosaNameToken=Dosa_PlaytestConsent'
			);
	}

	/**
	 * Fired by C++ whenever main menu is switched to.
	 */
	static onShowMainMenu() {
		this.panels.movie = $<Movie>('#MainMenuMovie');
		this.panels.image = $<Image>('#MainMenuBackground');

		this.setMainMenuBackground();
	}

	/**
	 * Fired by C++ whenever main menu is switched from.
	 */
	static onHideMainMenu() {
		UiToolkitAPI.CloseAllVisiblePopups();
	}

	/**
	 * Fired by C++ whenever pause menu (i.e. main menu when in a map) is switched to.
	 */
	static onShowPauseMenu() {
		this.panels.cp.AddClass('MainMenuRootPanel--PauseMenuMode');
	}

	/**
	 * Fired by C++ whenever pause menu is switched from.
	 */
	static onHidePauseMenu() {
		this.panels.cp.RemoveClass('MainMenuRootPanel--PauseMenuMode');

		// Save to file whenever the settings page gets closed
		/*if (this.activeTab === 'Settings') {
			$.DispatchEvent('SettingsSave');
		}*/
	}
	
	
	static openPage(pageName: string) {
		let page = this.pages[pageName];
		if (!page) {
			$.Warning("Unknown page name: '" + pageName + "'");
			return;
		}
		
		if (page.content === null && this.panels.pagesContainer != null) {
			const newPanel = $.CreatePanel("Panel", this.panels.pagesContainer, page.name);
			newPanel.LoadLayout(page.layoutFile, false, false);
			newPanel.RegisterForReadyEvents(true);

			page.content = newPanel;
			
			// dynamically add any blurrects to the pageBlur, you only need to do this once when the page is created
			let pageBlurPanels = page.content.FindChildrenWithClassTraverse("menu-page__blur-rect");
			for (let i = 0; i < pageBlurPanels.length; i++) {
				this.panels.pageBlur?.AddBlurPanel(pageBlurPanels[i]);
			}
		}
		
		//this.panels.mainMenuNavlist?.SetHasClass('menu-page--hidden', true);
		//this.panels.mainMenuNavlist?.SetHasClass('menu-page--shown', false);
		this.pages.navlist.hide();
		page.show();
		this.triggerBlurAnim();
		
		if (this.currentPage != this.pages.navlist) {
			this.pageHistory.push(this.currentPage); // save the previous page so we can return to it later
		}
		this.currentPage = page;
		//this.currentPage.content.SetFocus(); // revolution uses SetFocus a lot but I lowkey don't know what it does
	}
	
	static onBackButtonPressed() {
		this.currentPage.hide();
		let newPage = this.pageHistory.pop()
		if (newPage) {
			this.currentPage = newPage;
		} else {
			this.currentPage = this.pages.navlist;
		}
		this.currentPage.show();
		this.triggerBlurAnim();
	}
	
	static navigateHome() {
		this.currentPage.hide();
		this.pages.navlist.show();
		this.pageHistory = [];
		this.currentPage = this.pages.navlist;
		this.triggerBlurAnim();
	}
	
	static triggerBlurAnim() {
		// janky solution but removing the page transition class and immediately putting it back retriggers the anim
		// as far as I can tell, this is the right way to do it :P
		this.panels.pageBlur?.SetHasClass("mainmenu__page-blur--page-transition", false);
		this.panels.pageBlur?.SetHasClass("mainmenu__page-blur--page-transition", true);
	}

	/**
	 * Set the video background based on persistent storage settings
	 */
	static setMainMenuBackground() {
		if (!this.panels.movie?.IsValid() || !this.panels.image?.IsValid()) return;

		let useVideo = $.persistentStorage.getItem('settings.mainMenuMovie');

		if (useVideo === null) {
			// Enable video by default
			useVideo = true;
			$.persistentStorage.setItem('settings.mainMenuMovie', true);
		}

		this.panels.movie.visible = !!useVideo;
		this.panels.movie.SetReadyForDisplay(!!useVideo);

		this.panels.image.visible = !useVideo;
		this.panels.image.SetReadyForDisplay(!useVideo);

		let movie = 'file://{media}/menu_act04.webm';

		if (useVideo) {
			this.panels.movie.SetMovie(movie);
			this.panels.movie.Play();
		} else {
			this.panels.image.SetImage('file://{images}/menu/mockup_background.png');
		}
	}

	/**
	 * Handles when the quit button is shown, either from button getting pressed or event fired from C++.
	 * @param {boolean} toDesktop
	 */
	static onQuitPrompt(toDesktop = true) {
		if (!toDesktop) return; // currently don't handle disconnect prompts

		$.DispatchEvent('MainMenuPauseGame'); // make sure game is paused so we can see the popup if hit from a keybind in-game

		UiToolkitAPI.ShowGenericPopupTwoOptionsBgStyle(
			$.LocalizeSafe('#Action_Quit'),
			$.LocalizeSafe('#Action_Quit_Message'),
			'warning-popup',
			$.LocalizeSafe('#Action_Quit'),
			this.quitGame,
			$.LocalizeSafe('#Action_Return'),
			() => {},
			'blur'
		);
	}

	/** Quits the game. Bye! */
	static quitGame() {
		GameInterfaceAPI.ConsoleCommand('quit');
	}
	
	static disconnect() {
		GameInterfaceAPI.ConsoleCommand('disconnect');
	}

	/**
	 * Handles the escape key getting pressed
	 * @param {unknown} _eSource - C++ dev needs to explain what these params do. Pressing in main menu returns "MainMenuInput"
	 * @param {unknown} _nRepeats - Pressing in main menu returns "keyboard"
	 * @param {unknown} _focusPanel - Pressing in main menu returns undefined
	 */
	static onEscapeKeyPressed(_eSource, _focusPanel) {
		if (this.currentPage != this.pages.navlist) {
			this.onBackButtonPressed();
			return;
		}
		if (GameInterfaceAPI.GetGameUIState() === GameUIState.PAUSEMENU) {
			this.resumeGame();
		}
	}
	
	static resumeGame() {
		$.DispatchEvent('MainMenuResumeGame');
	}

	static onBackgroundMapLoaded(map: string, isBackgroundMap: boolean) {
		if (isBackgroundMap) {
			this.panels.movie?.Stop();
			this.panels.movie?.AddClass('mainmenu__fadeout');
		}
	}

	static onMapUnloaded() {
		if (this.panels.movie?.IsValid()) {
			this.panels.movie?.RemoveClass('mainmenu__fadeout');
			this.panels.movie?.Play();
		}
	}
}
