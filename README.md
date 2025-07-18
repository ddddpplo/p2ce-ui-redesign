# P2CE UI Redesign / UI Template
### Description
This repository contains a UI redesign for Portal 2 Community Edition, made with Panorama UI.
It is intended to be used as a template for mods of p2ce, used with credit to me, MostlyDaniel.
Note that this is still in development, so many things are not yet functional.\
\
Credit IS required when using this UI template. A copy of the `LICENSE` file found in this repository must be included in your mod,
and preferably I'd also be listed in your mod's credits.
### Instructions for use
If you wish to use this in your mod, fork this repository into your mod folder and add the directory to your mod's `SearchPaths` in gameinfo.txt, same as mounting any other mod folder.
You can also optionally clone this reposotory, but forking will make it as seamless as possible to update when I add new features.\
\
To add your own mod's chapters to the menu, navigate to `panorama/scripts/pages/main-menu/chapter-select.ts` and replace the contents of the `chapters` array with your own map names.
Then find and replace any instance of `#portal2_` with your own mod name so that it reads from the correct language file.\
\
Then go into your language file (for example `resource/portal2_english.txt` but with the name of your mod, create one if you don't yet have one) and define the names of your chapters. 
The ones in Portal 2 look like `#portal2_Chapter1_Subtitle` and yours should follow the same format\
\
Currently there's not much else to customize besides various styling, but I will add more to the readme as more features are added.

### Want to help out?
If you wish to contribute to this project, message me (mostlydaniel) on discord so that we can work together. This repository is open source, so I will merge in any pull requests that make a positive contribution.
