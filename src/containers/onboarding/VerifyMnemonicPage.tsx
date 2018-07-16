import { inject, observer } from 'mobx-react';
import * as React from 'react';
import { FormattedMessage } from 'react-intl';
import Typography from '@material-ui/core/Typography';
import Grid from '@material-ui/core/Grid';
import Hidden from '@material-ui/core/Hidden';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';
import ModalPaper from '../../components/ModalPaper';
import ModalPaperHeader from '../../components/ModalPaperHeader';
import * as classNames from 'classnames';
import {
  Theme,
  createStyles,
  withStyles,
  WithStyles
} from '@material-ui/core/styles';
import {
  onboardingAccountCreatedRoute,
  onboardingNewAccountRoute
} from '../../routes';
import Store from '../../stores/store';
import UserStore from '../../stores/user';

const styles = (theme: Theme) => {
  const { pxToRem } = theme.typography;
  const mnemonicFontSize = 16;
  const mnemonicLineHeight = 24.5;

  return createStyles({
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
  });
};

function round(val: number) {
  return Math.round(val * 1e5) / 1e5;
}

interface Props extends WithStyles<typeof styles> {
  store?: Store;
  userStore?: UserStore;
  mnemonic?: string[];
}

interface State {
  mnemonic: string[];
  uncheckedIndices: number[];
  currentWordIndex: number;
  currentWordValue: string;
  currentWordInvalid: boolean;
}

const stylesDecorator = withStyles(styles, { name: 'OnboardingVerifyMnemonicPage' });

@inject('store')
@inject('userStore')
@observer
class VerifyMnemonicPage extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);

    const mnemonic = props.mnemonic || props.store!.mnemonic;
    if (!mnemonic) {
      this.props.store!.router.goTo(onboardingNewAccountRoute);
    }

    const uncheckedIndices = mnemonic!.map((_, i) => i);
    const randIdx = Math.trunc(Math.random() * uncheckedIndices.length);
    const currentWordIndex = uncheckedIndices.splice(randIdx, 1)[0];
    this.state = {
      mnemonic: mnemonic!,
      uncheckedIndices,
      currentWordIndex,
      currentWordValue: '',
      currentWordInvalid: false
    };
  }

  handleCloseClick = () => {
    this.props.store!.router.goTo(onboardingNewAccountRoute);
  }

  handleCurrentWordChange = (ev: React.ChangeEvent<HTMLInputElement>) => {
    let value = ev.target.value;
    value = value.toLowerCase().trim();

    this.setState({
      currentWordValue: value
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
        currentWordInvalid: false
      });
    } else {
      this.props.store!.address = this.props.userStore!.registerAccount(
        mnemonic
      );
      // TODO clear the onboarding tmp data
      // this.props.store!.registrationCompleted();
      this.props.store!.router.goTo(onboardingAccountCreatedRoute);
    }
  }

  render() {
    const { classes } = this.props;
    const { mnemonic, uncheckedIndices, currentWordIndex } = this.state;

    const words: Array<'unchecked' | 'checked' | 'current'> = mnemonic.map(
      (_, idx) => {
        if (idx === currentWordIndex) {
          return 'current';
        } else if (uncheckedIndices.indexOf(idx) >= 0) {
          return 'unchecked';
        } else {
          return 'checked';
        }
      }
    );

    return (
      <ModalPaper open={true}>
        <ModalPaperHeader
          closeButton={true}
          onCloseClick={this.handleCloseClick}
        >
          <FormattedMessage
            id="onboarding-verify-mnemonic.title"
            description="Verify mnemonic screen title"
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
              <Typography
                component="p"
                variant="title"
                className={classes.mnemonic}
              >
                {words.map((state, idx) => (
                  <React.Fragment key={idx}>
                    <span className={classes.wordGroup}>
                      <span className={classes.wordLabel}>#{idx + 1}</span>
                      <span
                        className={classNames(
                          classes.wordValue,
                          state === 'current' && classes.currentWordValue
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
              <FormattedMessage
                id="onboarding-verify-mnemonic.verify-mnemonic"
                description="Instructions to verify the Nth word of the mnemonic"
                defaultMessage={
                  `Verify that you wrote down your mnemonic correctly. ` +
                  `Enter the {whichWordInBold} into the text field below.`
                }
                values={{
                  whichWordInBold: (
                    <FormattedMessage
                      tagName="strong"
                      id="onboarding-verify-mnemonic.verify-mnemonic-which-word"
                      description="Highlighted Nth word message to be injected"
                      defaultMessage={
                        `{whichWord, selectordinal,` +
                        ` one {#st word}` +
                        ` two {#nd word}` +
                        ` few {#rd word}` +
                        ` other {#th word}` +
                        `}`
                      }
                      values={{
                        whichWord: currentWordIndex + 1
                      }}
                    />
                  )
                }}
              />
            </Typography>
          </Grid>
          <Grid item={true} xs={12}>
            <TextField
              label={
                <FormattedMessage
                  id="onboarding-verify-mnemonic.input-label-which-word"
                  description="Word number to enter into the text field"
                  defaultMessage="Word #{whichWord, number}"
                  values={{
                    whichWord: currentWordIndex + 1
                  }}
                />
              }
              fullWidth={true}
              error={this.state.currentWordInvalid}
              value={this.state.currentWordValue}
              onChange={this.handleCurrentWordChange}
            />
          </Grid>
          <Grid item={true} xs={12}>
            {this.state.uncheckedIndices.length > 0 ? (
              <Button type="submit" fullWidth={true}>
                <FormattedMessage
                  id="onboarding-verify-mnemonic.verify"
                  description="Verify button label"
                  defaultMessage="Verify"
                />
              </Button>
            ) : (
              <Button type="submit" fullWidth={true}>
                <FormattedMessage
                  id="onboarding-verify-mnemonic.verify-and-continue"
                  description="Verify button label"
                  defaultMessage="Verify & continue"
                />
              </Button>
            )}
          </Grid>
        </Grid>
      </ModalPaper>
    );
  }
}

// TODO make it a decorator
export default stylesDecorator(VerifyMnemonicPage);