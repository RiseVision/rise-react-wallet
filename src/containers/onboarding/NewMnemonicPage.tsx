import Button from '@material-ui/core/Button';
import Grid from '@material-ui/core/Grid';
import {
  createStyles,
  Theme,
  withStyles,
  WithStyles
} from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import * as bip39 from 'bip39';
import * as classNames from 'classnames';
import { inject, observer } from 'mobx-react';
import { RouterStore } from 'mobx-router';
import * as React from 'react';
import { FormattedMessage } from 'react-intl';
import ModalPaper from '../../components/ModalPaper';
import ModalPaperHeader from '../../components/ModalPaperHeader';
import {
  onboardingNewAccountRoute,
  onboardingVerifyMnemonicsRoute
} from '../../routes';
import OnboardingStore from '../../stores/onboarding';

const styles = (theme: Theme) => {
  const { pxToRem } = theme.typography;
  const mnemonicFontSize = 21;
  const mnemonicLineHeight = 24.5;

  let wordLabels = {};
  for (let i = 1; i <= 12; i++) {
    wordLabels[`&.${i}::before`] = { content: `"${i}"` };
  }

  return createStyles({
    content: {
      padding: 20
    },
    mnemonic: {
      fontSize: pxToRem(mnemonicFontSize),
      lineHeight: `${round((mnemonicLineHeight + 20) / mnemonicFontSize)}em`,
      textAlign: 'center'
    },
    separator: {},
    word: {
      display: 'inline-block',
      position: 'relative',
      marginLeft: '0.2em',
      marginRight: '0.2em',
      '&::before': {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: `${round((mnemonicLineHeight + 8) / 10)}em`,
        fontSize: pxToRem(10),
        lineHeight: '1em',
        opacity: 0.5,
        userSelect: 'none',
        pointerEvents: 'none'
      }
    },
    'word-1': { '&::before': { content: '"#1"' } },
    'word-2': { '&::before': { content: '"#2"' } },
    'word-3': { '&::before': { content: '"#3"' } },
    'word-4': { '&::before': { content: '"#4"' } },
    'word-5': { '&::before': { content: '"#5"' } },
    'word-6': { '&::before': { content: '"#6"' } },
    'word-7': { '&::before': { content: '"#7"' } },
    'word-8': { '&::before': { content: '"#8"' } },
    'word-9': { '&::before': { content: '"#9"' } },
    'word-10': { '&::before': { content: '"#10"' } },
    'word-11': { '&::before': { content: '"#11"' } },
    'word-12': { '&::before': { content: '"#12"' } }
  });
};

function newMnemonic(): string[] {
  return bip39.generateMnemonic().split(' ');
}

function round(val: number) {
  return Math.round(val * 1e5) / 1e5;
}

interface Props extends WithStyles<typeof styles> {
  mnemonic?: string[];
}

interface PropsInjected extends Props {
  onboardingStore: OnboardingStore;
  routerStore: RouterStore;
}

interface State {
  mnemonic: string[];
}

const stylesDecorator = withStyles(styles, {
  name: 'OnboardingNewMnemonicPage'
});

@inject('onboardingStore')
@inject('routerStore')
@observer
class NewMnemonicPage extends React.Component<Props, State> {
  get injected(): PropsInjected {
    // @ts-ignore
    return this.props;
  }

  constructor(props: Props) {
    super(props);
    this.state = {
      mnemonic: props.mnemonic || newMnemonic()
    };
  }

  handleCloseClick = () => {
    const { routerStore } = this.injected;
    routerStore.goTo(onboardingNewAccountRoute);
  }

  handleContinueClick = () => {
    const { routerStore, onboardingStore } = this.injected;
    onboardingStore.mnemonic = this.state.mnemonic;
    routerStore.goTo(onboardingVerifyMnemonicsRoute);
  }

  render() {
    const { classes } = this.injected;
    const { mnemonic } = this.state;
    const wordCount = mnemonic.length;

    return (
      <ModalPaper open={true}>
        <ModalPaperHeader onCloseClick={this.handleCloseClick}>
          <FormattedMessage
            id="onboarding-new-mnemonic.title"
            description="New mnemonic screen title"
            defaultMessage="Write this down"
          />
        </ModalPaperHeader>
        <Grid
          container={true}
          className={classes.content}
          spacing={16}
          justify="center"
        >
          <Grid item={true} xs={12}>
            <Typography>
              <FormattedMessage
                id="onboarding-new-mnemonic.mnemonic-pretext"
                description="Text before the mnemonic secret"
                defaultMessage={`This is your new {wordCount, number}-word mnemonic secret:`}
                values={{
                  wordCount
                }}
              />
            </Typography>
          </Grid>
          <Grid item={true} xs={12}>
            <Typography
              className={classes.mnemonic}
              component="p"
              variant="title"
            >
              {mnemonic.map((word, idx) => (
                <React.Fragment key={idx}>
                  {idx > 0 && ' '}
                  <span
                    className={classNames(
                      classes.word,
                      classes[`word-${idx + 1}`]
                    )}
                  >
                    {word}
                  </span>
                </React.Fragment>
              ))}
            </Typography>
          </Grid>
          <Grid item={true} xs={12}>
            <Typography>
              <FormattedMessage
                id="onboarding-new-mnemonic.write-mnemonic-down"
                description="Instructions to write down the mnemonic"
                defaultMessage={
                  `Write your mnemonic down on a physical piece of paper so ` +
                  `that you could store it in a safe place later.`
                }
              />
            </Typography>
          </Grid>
          <Grid item={true} xs={12}>
            <Typography>
              <FormattedMessage
                id="onboarding-new-mnemonic.mnemonic-grants-full-access"
                description="Final notice about the seriousness of mnemonic"
                defaultMessage="NB! Anyone who knows this can transfer funds out of your account."
              />
            </Typography>
          </Grid>
          <Grid item={true} xs={12}>
            <Button fullWidth={true} onClick={this.handleContinueClick}>
              <FormattedMessage
                id="onboarding-new-mnemonic.continue"
                description="Continue button label"
                defaultMessage="Continue"
              />
            </Button>
          </Grid>
        </Grid>
      </ModalPaper>
    );
  }
}

export default stylesDecorator(NewMnemonicPage);
