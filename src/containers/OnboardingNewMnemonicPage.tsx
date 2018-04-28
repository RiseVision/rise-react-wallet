import * as React from 'react';
import { FormattedMessage } from 'react-intl';
import Typography from 'material-ui/Typography';
import Grid from 'material-ui/Grid';
import Button from 'material-ui/Button';
import ModalPaper from '../components/ModalPaper';
import ModalPaperHeader from '../components/ModalPaperHeader';
import { withStyles, WithStyles } from 'material-ui/styles';

type OnboardingNewMnemonicPageClassKey =
  | 'content'
  | 'mnemonic'
  | 'wordGroup'
  | 'wordLabel'
  | 'wordValue';

function round(val: number) {
  return Math.round(val * 1e5) / 1e5;
}

const stylesDecorator = withStyles<OnboardingNewMnemonicPageClassKey>(
  (theme) => {
    const { pxToRem } = theme.typography;
    const mnemonicFontSize = 21;
    const mnemonicLineHeight = 24.5;

    return {
      content: {
        padding: 20,
      },
      mnemonic: {
        wordSpacing: '0.4em',
        fontSize: pxToRem(mnemonicFontSize),
        lineHeight: `${round((mnemonicLineHeight + 20) / mnemonicFontSize)}em`,
        textAlign: 'center',
      },
      wordGroup: {
        position: 'relative',
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
      },
      wordValue: {
      },
    };
  },
  { name: 'OnboardingNewMnemonicPage' }
);

interface Props {
  mnemonic: string[];
  onClose: () => void;
  onVerifyMnemonic: () => void;
}

type DecoratedProps = Props & WithStyles<OnboardingNewMnemonicPageClassKey>;

const OnboardingNewMnemonicPage = stylesDecorator<Props>(
  class extends React.Component<DecoratedProps> {
    handleCloseClick = () => {
      this.props.onClose();
    }

    handleContinueClick = () => {
      this.props.onVerifyMnemonic();
    }

    render() {
      const { classes, mnemonic } = this.props;
      const wordCount = mnemonic.length;

      return (
        <ModalPaper>
          <ModalPaperHeader closeButton={true} onCloseClick={this.handleCloseClick}>
            <FormattedMessage
              id="onboarding-new-mnemonic.title"
              description="New mnemonic screen title"
              defaultMessage="Write this down"
            />
          </ModalPaperHeader>
          <Grid container={true} className={classes.content} spacing={16} justify="center">
            <Grid item={true} xs={12}>
              <Typography>
                This is your new {wordCount}-word mnemonic secret:
              </Typography>
            </Grid>
            <Grid item={true} xs={12}>
              <Typography className={classes.mnemonic} component="p" variant="title">
                {mnemonic.map((word, idx) => (
                  <React.Fragment key={idx}>
                    {idx > 0 && ' '}
                    <span className={classes.wordGroup}>
                      <span className={classes.wordLabel}>#{idx + 1}</span>
                      <span className={classes.wordValue}>{word}</span>
                    </span>
                  </React.Fragment>
                ))}
              </Typography>
            </Grid>
            <Grid item={true} xs={12}>
              <Typography>
                Write your mnemonic down on a physical piece of paper so that you could
                store it in a safe place later.
              </Typography>
            </Grid>
            <Grid item={true} xs={12}>
              <Typography>
                NB! Anyone who knows this can transfer funds out of your account.
              </Typography>
            </Grid>
            <Grid item={true} xs={12}>
              <Button fullWidth={true} onClick={this.handleContinueClick}>Continue</Button>
            </Grid>
          </Grid>
        </ModalPaper>
      );
    }
  }
);

export default OnboardingNewMnemonicPage;
