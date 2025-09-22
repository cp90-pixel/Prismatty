declare const prism: prism.Prism;

declare namespace prism {
  type ForegroundColorCanonical =
    | 'black'
    | 'red'
    | 'green'
    | 'yellow'
    | 'blue'
    | 'magenta'
    | 'cyan'
    | 'white'
    | 'gray'
    | 'brightBlack'
    | 'brightRed'
    | 'brightGreen'
    | 'brightYellow'
    | 'brightBlue'
    | 'brightMagenta'
    | 'brightCyan'
    | 'brightWhite';

  type BackgroundColorCanonical =
    | 'black'
    | 'red'
    | 'green'
    | 'yellow'
    | 'blue'
    | 'magenta'
    | 'cyan'
    | 'white'
    | 'gray'
    | 'brightBlack'
    | 'brightRed'
    | 'brightGreen'
    | 'brightYellow'
    | 'brightBlue'
    | 'brightMagenta'
    | 'brightCyan'
    | 'brightWhite';

  type ForegroundColor = ForegroundColorCanonical | 'grey';
  type BackgroundColor = BackgroundColorCanonical | 'grey';

  type ModifierCanonical =
    | 'reset'
    | 'bold'
    | 'dim'
    | 'italic'
    | 'underline'
    | 'blink'
    | 'inverse'
    | 'hidden'
    | 'strikethrough';

  type ModifierAlias = 'faint' | 'conceal' | 'strike' | 'strikethru';

  type Modifier = ModifierCanonical | ModifierAlias;
  type ModifierWithoutReset = Exclude<ModifierCanonical, 'reset'>;

  interface ColorInfo {
    readonly name: ForegroundColorCanonical;
    readonly code: number;
  }

  interface BackgroundInfo {
    readonly name: BackgroundColorCanonical;
    readonly code: number;
  }

  interface ModifierInfo {
    readonly name: ModifierCanonical;
    readonly code: number;
  }

  interface NormalizedStyle {
    readonly color: ColorInfo | null;
    readonly background: BackgroundInfo | null;
    readonly modifiers: readonly ModifierInfo[];
  }

  type ModifierCollection = Modifier | readonly Modifier[];

  interface PrismStyleOptions {
    readonly color?: ForegroundColor | null;
    readonly foreground?: ForegroundColor | null;
    readonly fg?: ForegroundColor | null;
    readonly background?: BackgroundColor | null;
    readonly bg?: BackgroundColor | null;
    readonly backgroundColor?: BackgroundColor | null;
    readonly bgColor?: BackgroundColor | null;
    readonly modifiers?: ModifierCollection | null;
    readonly modifier?: ModifierCollection | null;
    readonly effects?: ModifierCollection | null;
    readonly effect?: ModifierCollection | null;
    readonly styles?: ModifierCollection | null;
    readonly style?: ModifierCollection | null;
  }

  type StyleName = ForegroundColor | BackgroundColor | Modifier;
  type StyleInput = StyleName | PrismStyleOptions | NormalizedStyle | readonly StyleInput[];

  interface Colorize {
    (value: unknown, ...styles: StyleInput[]): string;
  }

  interface PrismFormatter extends Colorize {
    readonly style: NormalizedStyle;
    compose(...styles: StyleInput[]): PrismFormatter;
    with(...styles: StyleInput[]): PrismFormatter;
  }

  interface PrismColorFormatters extends Record<ForegroundColorCanonical, PrismFormatter> {
    readonly grey: PrismFormatter;
  }

  interface PrismBackgroundFormatters extends Record<BackgroundColorCanonical, PrismFormatter> {
    readonly grey: PrismFormatter;
  }

  type PrismModifierFormatters = Record<ModifierWithoutReset, PrismFormatter>;

  interface AvailableStyles {
    readonly colors: readonly ForegroundColorCanonical[];
    readonly backgrounds: readonly BackgroundColorCanonical[];
    readonly modifiers: readonly ModifierWithoutReset[];
  }

  interface Prism extends Colorize {
    readonly colorize: Colorize;
    compose(...styles: StyleInput[]): PrismFormatter;
    with(...styles: StyleInput[]): PrismFormatter;
    readonly strip: (value: unknown) => string;
    readonly colors: PrismColorFormatters;
    readonly backgrounds: PrismBackgroundFormatters;
    readonly modifiers: PrismModifierFormatters;
    readonly available: AvailableStyles;
  }

  const colorize: Colorize;
  const compose: (...styles: StyleInput[]) => PrismFormatter;
  const strip: (value: unknown) => string;
  const colors: PrismColorFormatters;
  const backgrounds: PrismBackgroundFormatters;
  const modifiers: PrismModifierFormatters;
  const available: AvailableStyles;
}

export = prism;
