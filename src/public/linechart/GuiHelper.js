import { GUI } from "/modules/dat.gui.module.js";
class GuiHelper {
  constructor(game) {
    // Reference to the game instance
    this.game = game;

    // Create a new dat.GUI instance
    this.gui = new GUI();

    // Initialize GUI elements
    this.initGui();
  }

  initGui() {
    // Example: Add a folder
    const folder1 = this.gui.addFolder("Folder 1");
    folder1.open();

    // Example: Add a slider linked to the scalingFactor of the game instance
    folder1
      .add(this.game, "scalingFactor", 0.0001, 0.001)
      .name("Scaling Factor")
      .onChange(() => {
        // Code to run when the slider value changes
        this.game.updateAfterGui();
      });

    // Example: Add a slider linked to the scalingFactor of the game instance
    folder1
      .add(this.game, "horizontalScalingFactor", 0.01, 1)
      .name("Horizontal Scaling Factor")
      .onChange(() => {
        // Code to run when the slider value changes
        this.game.updateAfterGui();
      });

      folder1
      .add(this.game, "barWidthScalingFactor", 0.01, 1)
      .name("Bar Width Scaling Factor")
      .onChange(() => {
        // Code to run when the slider value changes
        this.game.updateAfterGui();
      });
      folder1
      .add(this.game, "textSizeScalingFactor", 0.01, 1)
      .name("Text Size Scaling Factor")
      .onChange(() => {
        // Code to run when the slider value changes
        this.game.updateAfterGui();
      });


    // You can continue to add more GUI elements as needed
  }
}

export { GuiHelper };
