import * as React from 'react';
import { FormattedMessage } from 'react-intl';
import Typography from '@material-ui/core/Typography';
import Grid from '@material-ui/core/Grid';
import Hidden from '@material-ui/core/Hidden';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';
import ModalPaper from '../components/ModalPaper';
import ModalPaperHeader from '../components/ModalPaperHeader';
import * as classNames from 'classnames';
import { withStyles, WithStyles } from '@material-ui/core/styles';

type OnboardingVerifyMnemonicPageClassKey =
  | 'content'
  | 'mnemonic'
  | 'wordGroup'
  | 'wordLabel'
  | 'wordValue'
  | 'currentWordValue';

function round(val: number) {
  return Math.round(val * 1e5) / 1e5;
}

const stylesDecorator = withStyles<OnboardingVerifyMnemonicPageClassKey>(
  (theme) => {
    const { pxToRem } = theme.typography;
    const mnemonicFontSize = 16;
    const mnemonicLineHeight = 24.5;

    return {
      content: {
        padding: 20,
      },
      mnemonic: {
        display: 'flex',
        justifyContent: 'center',
        flexWrap: 'wrap',
        fontSize: pxToRem(mnemonicFontSize),
        lineHeight: `${round(mnemonicLineHeight / mnemonicFontSize)}em`,
        verticalAlign: 'bottom',
        textAlign: 'center',
        userSelect: 'none',
      },
      wordGroup: {
        position: 'relative',
        marginTop: pxToRem(10),
        marginBottom: pxToRem(10),
        marginLeft: '0.35em',
        marginRight: '0.35em',
      },
      wordLabel: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: `${round((mnemonicLineHeight + 3) / 10)}em`,
        fontSize: pxToRem(10),
        lineHeight: '1em',
        opacity: 0.5,
        userSelect: 'none',
        pointerEvents: 'none',
      },
      wordValue: {
        display: 'block',
        minWidth: `${round(64 / mnemonicFontSize)}em`,
        height: `${round(24.5 / mnemonicFontSize)}em`,
        borderBottom: '1px dotted #999',
        color: '#999'
      },
      currentWordValue: {
        color: theme.palette.text.primary,
        borderBottom: '1px dashed #000',
      },
    };
  },
  { name: 'OnboardingVerifyMnemonicPage' }
);

interface Props {
  mnemonic: string[];
  onClose: () => void;
  onMnemonicVerified: () => void;
}

interface State {
  mnemonic: string[];
  uncheckedIndices: number[];
  currentWordIndex: number;
  currentWordValue: string;
  currentWordInvalid: boolean;
}

type DecoratedProps = Props & WithStyles<OnboardingVerifyMnemonicPageClassKey>;

const OnboardingVerifyMnemonicPage = stylesDecorator<Props>(
  class extends React.Component<DecoratedProps, State> {
    static getDerivedStateFromProps(nextProps: Readonly<DecoratedProps>, prevState: State): Partial<State> | null {
      if (mnemonicsEquals(prevState.mnemonic, nextProps.mnemonic)) {
        return null;
      }

      const { mnemonic } = nextProps;
      let uncheckedIndices = nextProps.mnemonic.map((_, i) => i);
      let randIdx = Math.trunc(Math.random() * uncheckedIndices.length);
      const currentWordIndex = uncheckedIndices.splice(randIdx, 1)[0];

      return {
        mnemonic,
        uncheckedIndices,
        currentWordIndex,
        currentWordValue: '',
        currentWordInvalid: false,
      };
    }

    constructor(props: DecoratedProps) {
      super(props);
      this.state = {
        mnemonic: [],
        uncheckedIndices: [],
        currentWordIndex: 0,
        currentWordValue: '',
        currentWordInvalid: false,
      };
    }

    handleCloseClick = () => {
      this.props.onClose();
    }

    handleCurrentWordChange = (ev: React.ChangeEvent<HTMLInputElement>) => {
      let value = ev.target.value;
      value = value.toLowerCase().trim();

      this.setState({
        currentWordValue: value,
      });
    }

    handleFormSubmit = (ev: React.FormEvent<HTMLFormElement>) => {
      ev.preventDefault();

      const { mnemonic, currentWordValue } = this.state;
      let { currentWordIndex } = this.state;

      if (mnemonic[currentWordIndex] !== currentWordValue) {
        this.setState({ currentWordInvalid: true });
      } else if (this.state.uncheckedIndices.length > 0) {
        let uncheckedIndices = this.state.uncheckedIndices.slice();
        let randIdx = Math.trunc(Math.random() * uncheckedIndices.length);
        currentWordIndex = uncheckedIndices.splice(randIdx, 1)[0];

        this.setState({
          uncheckedIndices,
          currentWordIndex,
          currentWordValue: '',
          currentWordInvalid: false,
        });
      } else {
        this.props.onMnemonicVerified();
      }
    }

    render() {
      const { classes } = this.props;
      const { mnemonic, uncheckedIndices, currentWordIndex } = this.state;

      const words: Array<'unchecked' | 'checked' | 'current'> = mnemonic.map((_, idx) => {
        if (idx === currentWordIndex) {
          return 'current';
        } else if (uncheckedIndices.indexOf(idx) >= 0) {
          return 'unchecked';
        } else {
          return 'checked';
        }
      });

      return (
        <ModalPaper>
          <ModalPaperHeader closeButton={true} onCloseClick={this.handleCloseClick}>
            <FormattedMessage
              id="onboarding-verify-mnemonic.title"
              description="New mnemonic screen title"
              defaultMessage="Check mnemonic"
            />
          </ModalPaperHeader>
          <Grid
            container={true}
            className={classes.content}
            spacing={16}
            justify="center"
            component="form"
            onSubmit={this.handleFormSubmit}
          >
            <Hidden xsDown={true}>
              <Grid item={true} xs={12}>
                <Typography component="p" variant="title" className={classes.mnemonic}>
                  {words.map((state, idx) => (
                    <React.Fragment key={idx}>
                      <span className={classes.wordGroup}>
                        <span className={classes.wordLabel}>#{idx + 1}</span>
                        <span
                          className={classNames(
                            classes.wordValue,
                            state === 'current' && classes.currentWordValue,
                          )}
                        >
                          {state === 'current' && '?'}
                          {state === 'checked' && '✓'}
                        </span>
                      </span>
                    </React.Fragment>
                  ))}
                </Typography>
              </Grid>
            </Hidden>
            <Grid item={true} xs={12}>
              <Typography>
                Verify that you wrote down your mnemonic correctly. Enter
                the <strong>{currentWordIndex + 1}th word</strong> into the text field below.
              </Typography>
            </Grid>
            <Grid item={true} xs={12}>
              <TextField
                label={'Word #' + (currentWordIndex + 1)}
                fullWidth={true}
                error={this.state.currentWordInvalid}
                value={this.state.currentWordValue}
                onChange={this.handleCurrentWordChange}
              />
            </Grid>
            <Grid item={true} xs={12}>
              {this.state.uncheckedIndices.length > 0 ? (
                <Button type="submit" fullWidth={true}>
                  Verify
                </Button>
              ) : (
                <Button type="submit" fullWidth={true}>
                  Verify &amp; continue
                </Button>
              )}
            </Grid>
          </Grid>
        </ModalPaper>
      );
    }
  }
);

function mnemonicsEquals(a: string[], b: string[]): boolean {
  if (a.length !== b.length) {
    return false;
  }
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) {
      return false;
    }
  }
  return true;
}

export default OnboardingVerifyMnemonicPage;
