import * as React from 'react';
import { FormattedMessage } from 'react-intl';
import ModalPaper from '../components/ModalPaper';
import ModalPaperHeader from '../components/ModalPaperHeader';
import Typography from 'material-ui/Typography';
import Button from 'material-ui/Button';
import Collapse from 'material-ui/transitions/Collapse';
import * as classNames from 'classnames';
import { withStyles, WithStyles } from 'material-ui/styles';

type OnboardingSecurityNoticePageClassKey =
  | 'content'
  | 'pretext'
  | 'tipContainer'
  | 'tipText'
  | 'inactiveTipText'
  | 'button';

const stylesDecorator = withStyles<OnboardingSecurityNoticePageClassKey>(
  (theme) => {
    return {
      content: {
        padding: 20,
      },
      pretext: {
        marginBottom: 5,
      },
      tipContainer: {
        paddingLeft: 20,
      },
      tipText: {
        display: 'list-item',
        listStyle: 'disc',
        marginTop: 5,
        marginBottom: 5,
      },
      inactiveTipText: {
        opacity: 0.65,
        transition: theme.transitions.create('opacity'),
      },
      button: {
        marginTop: 5,
      },
    };
  },
  { name: 'OnboardingSecurityNoticePage' }
);

interface Props {
  onGoBack: () => void;
  onContinue: () => void;
}

interface State {
  currentTip: number;
}

type DecoratedProps = Props & WithStyles<OnboardingSecurityNoticePageClassKey>;

const OnboardingSecurityNoticePage = stylesDecorator<Props>(
  class extends React.Component<DecoratedProps, State> {
    constructor(props: DecoratedProps) {
      super(props);
      this.state = {
        currentTip: 0,
      };
    }

    handleBackClick = () => {
      this.props.onGoBack();
    }

    handleNextTipClick = () => {
      this.setState((prevState) => {
        return { currentTip: prevState.currentTip + 1 };
      });
    }

    handleContinueClick = () => {
      this.props.onContinue();
    }

    render() {
      const { classes } = this.props;

      const tips = [(
        <FormattedMessage
          id="onboarding-security-notice.correct-url-tip"
          description="Tip about checking the browser URL"
          defaultMessage={
            'When accessing this wallet, always enter the URL yourself or use a bookmark that ' +
            'you yourself created. Never trust links posted to social media, sent in emails or ' +
            'listed on other websites.'
          }
        />
      ), (
        <FormattedMessage
          id="onboarding-security-notice.trust-browser-tip"
          description="Tip about truting your browser"
          defaultMessage={
            'If your browser gives you any sort of security warning about this web wallet, ' +
            'get in touch with us and report it. Do not ignore the warning nor enter your ' +
            'mnemonic secret!'
          }
        />
      ), (
        <FormattedMessage
          id="onboarding-security-notice.own-devices-tip"
          description="Tip about untrustworthy devices"
          defaultMessage={
            'Only use your own devices when accessing your accounts. Do not enter your mnemonic ' +
            'secret on untrustworthy devices (public computers, friends computers/phones, etc) ' +
            'as they might be littered with malware and keyloggers.'
          }
        />
      ), (
        <FormattedMessage
          id="onboarding-security-notice.apply-updates-tip"
          description="Tip about installing security updates"
          defaultMessage={
            'Always keep your operating system, anti-virus software and browser up to date with ' +
            'latest security updates.'
          }
        />
      ), (
        <FormattedMessage
          id="onboarding-security-notice.hardware-wallets-tip"
          description="Tip about using hardware wallets"
          defaultMessage={
            'If possible, prefer hardware wallets over mnemonic secret for storing larger ' +
            'amounts of RISE.'
          }
        />
      )];

      return (
        <ModalPaper>
          <ModalPaperHeader backButton={true} onBackClick={this.handleBackClick}>
            <FormattedMessage
              id="onboarding-security-notice.title"
              description="Security notice screen title"
              defaultMessage="Security tips"
            />
          </ModalPaperHeader>
          <div className={classes.content}>
            <Typography className={classes.pretext}>
              <FormattedMessage
                id="onboarding-security-notice.keep-in-mind"
                description="Notice before the list of tips"
                defaultMessage="Things to keep in mind to increase the security of your funds:"
              />
            </Typography>
            {tips.map((tip, idx) => (
              <Collapse
                key={idx}
                className={classes.tipContainer}
                in={idx <= this.state.currentTip}
              >
                <Typography
                  className={classNames(
                    classes.tipText,
                    idx !== this.state.currentTip && classes.inactiveTipText,
                  )}
                  children={tip}
                />
              </Collapse>
            ))}
            {this.state.currentTip + 1 < tips.length ? (
              <Button
                className={classes.button}
                onClick={this.handleNextTipClick}
                fullWidth={true}
              >
                Next tip
              </Button>
            ) : (
              <Button
                className={classes.button}
                onClick={this.handleContinueClick}
                fullWidth={true}
              >
                Continue
              </Button>
            )}
          </div>
        </ModalPaper>
      );
    }
  }
);

export default OnboardingSecurityNoticePage;
