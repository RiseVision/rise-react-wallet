import * as React from 'react';
import { FormattedMessage } from 'react-intl';
import Typography from 'material-ui/Typography';
import Grid from 'material-ui/Grid';
import TextField from 'material-ui/TextField';
import Button from 'material-ui/Button';
import ModalPaper from '../components/ModalPaper';
import ModalPaperHeader from '../components/ModalPaperHeader';
import { withStyles, WithStyles } from 'material-ui/styles';

type OnboardingVerifyMnemonicPageClassKey =
  | 'content'
  | 'mnemonic'
  | 'wordGroup'
  | 'wordLabel'
  | 'wordValue';

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
      },
      wordValue: {
        display: 'block',
        minWidth: `${round(64 / mnemonicFontSize)}em`,
        height: `${round(24.5 / mnemonicFontSize)}em`,
        borderBottom: '1px dotted #999',
      },
    };
  },
  { name: 'OnboardingVerifyMnemonicPage' }
);

interface Props {
  onGoBack: () => void;
}

type DecoratedProps = Props & WithStyles<OnboardingVerifyMnemonicPageClassKey>;

const OnboardingVerifyMnemonicPage = stylesDecorator<Props>(
  class extends React.Component<DecoratedProps> {
    handleBackClick = () => {
      this.props.onGoBack();
    }

    render() {
      const { classes } = this.props;
      let words: Array<'unchecked' | 'active' | 'checked'> = [
        'unchecked', 'unchecked', 'checked', 'active', 'unchecked', 'unchecked',
        'checked', 'unchecked', 'checked', 'unchecked', 'checked', 'unchecked',
      ];

      return (
        <ModalPaper>
          <ModalPaperHeader backButton={true} onBackClick={this.handleBackClick}>
            <FormattedMessage
              id="onboarding-verify-mnemonic.title"
              description="New mnemonic screen title"
              defaultMessage="Check mnemonic"
            />
          </ModalPaperHeader>
          <Grid container={true} className={classes.content} spacing={16} justify="center">
            <Grid item={true} xs={12} hidden={{xsDown: true}}>
              <Typography component="p" variant="title" className={classes.mnemonic}>
                {words.map((state, idx) => (
                  <React.Fragment key={idx}>
                    <span className={classes.wordGroup}>
                      <span className={classes.wordLabel}>#{idx + 1}</span>
                      <span className={classes.wordValue}>
                        {state === 'active' && '?'}
                        {state === 'checked' && '✓'}
                      </span>
                    </span>
                  </React.Fragment>
                ))}
              </Typography>
            </Grid>
            <Grid item={true} xs={12}>
              <Typography>
                Verify that you wrote down your mnemonic correctly. Enter
                the <strong>4th word</strong> into the text field below.
              </Typography>
            </Grid>
            <Grid item={true} xs={12}>
              <TextField
                label="Word #4"
                fullWidth={true}
              />
            </Grid>
            <Grid item={true} xs={12}>
              <Button fullWidth={true}>Verify &amp; continue</Button>
            </Grid>
          </Grid>
        </ModalPaper>
      );
    }
  }
);

export default OnboardingVerifyMnemonicPage;
