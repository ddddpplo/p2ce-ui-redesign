'use strict';

class MainMenu {
	static panels = {
		cp: $.GetContextPanel(),
		pageContent: $('#PageContent'),
		homeContent: $('#HomeContent'),
		contentBlur: $('#MainMenuContentBlur'),
		backgroundBlur: $('#MainMenuBackgroundBlur'),
		movie: $<Movie>('#MainMenuMovie'),
		image: $<Image>('#MainMenuBackground'),
		topButtons: $('#MainMenuTopButtons'),
		homeButton: $<RadioButton>('#HomeButton'),
		addonsButton: $<RadioButton>('#AddonsButton'),
		navlistFrame: $<Frame>('#MainMenuNavlistFrame')
	};

	static activeTab = '';
	
	static pageHistory = ['file://{resources}/layout/pages/main-menu/main-menu-navlist.xml'];

	static {
		$.RegisterForUnhandledEvent('ShowMainMenu', this.onShowMainMenu.bind(this));
		$.RegisterForUnhandledEvent('HideMainMenu', this.onHideMainMenu.bind(this));
		$.RegisterForUnhandledEvent('ShowPauseMenu', this.onShowPauseMenu.bind(this));
		$.RegisterForUnhandledEvent('HidePauseMenu', this.onHidePauseMenu.bind(this));
		$.RegisterForUnhandledEvent('ReloadBackground', this.setMainMenuBackground.bind(this));
		$.RegisterEventHandler('Cancelled', $.GetContextPanel(), this.onEscapeKeyPressed.bind(this));
		$.RegisterForUnhandledEvent('MapLoaded', this.onBackgroundMapLoaded.bind(this));
		$.RegisterForUnhandledEvent('MapUnloaded', this.onMapUnloaded.bind(this));

		$.DispatchEvent('HideIntroMovie');
	}

	/**
	 * General onLoad initialisations.
	 * Fired when MainMenu fires its onload event.
	 */
	static onMainMenuLoaded() {
		// These aren't accessible until the page has loaded fully, find them now
		this.panels.movie = $<Movie>('#MainMenuMovie');

		// TEMP: Hide the addons button if the workshop API is not available
		try {
			const count = WorkshopAPI.GetAddonCount();
		} catch (e) {
			if (this.panels.addonsButton) this.panels.addonsButton.visible = false;
		}

		if (GameInterfaceAPI.GetSettingBool('developer')) $('#ControlsLibraryButton')?.RemoveClass('hide');

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
		if (this.activeTab === 'Settings') {
			$.DispatchEvent('SettingsSave');
		}
	}
	
	
	static setPage(xmlName: string) {
		if (this.panels.navlistFrame) {
			let pageFileName = "file://{resources}/layout/pages/main-menu/" + xmlName + ".xml"
			this.panels.navlistFrame.SetSource(pageFileName);
			this.pageHistory.push(pageFileName);
		}
		$.Msg(this.pageHistory);
	}
	
	static onBackButtonPressed() {
		$.Msg(this.pageHistory);
		let previousPage = this.pageHistory[this.pageHistory.length - 1];
		if (previousPage) {
			this.panels.navlistFrame?.SetSource(previousPage);
		}
		$.Msg(this.pageHistory);
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
		// Resume game in pause menu mode, OTHERWISE close the active menu menu page
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
