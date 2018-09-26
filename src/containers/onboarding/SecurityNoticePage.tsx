import Button from '@material-ui/core/Button';
import Collapse from '@material-ui/core/Collapse';
import {
  createStyles,
  Theme,
  withStyles,
  WithStyles
} from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import * as classNames from 'classnames';
import { observer } from 'mobx-react';
import * as React from 'react';
import { FormattedMessage } from 'react-intl';
import Link from '../../components/Link';
import ModalPaper from '../../components/ModalPaper';
import ModalPaperHeader from '../../components/ModalPaperHeader';
import {
  onboardingNewAccountRoute,
  onboardingNewMnemonicRoute
} from '../../routes';

const styles = (theme: Theme) =>
  createStyles({
    content: {
      padding: 20
    },
    pretext: {
      marginBottom: 5
    },
    tipContainer: {
      paddingLeft: 20
    },
    tipText: {
      display: 'list-item',
      listStyle: 'disc',
      marginTop: 5,
      marginBottom: 5
    },
    inactiveTipText: {
      opacity: 0.65,
      transition: theme.transitions.create('opacity')
    },
    button: {
      marginTop: 5
    }
  });

interface Props extends WithStyles<typeof styles> {}

interface State {
  currentTip: number;
}

const stylesDecorator = withStyles(styles, {
  name: 'OnboardingSecurityNoticePage'
});

@observer
class SecurityNoticePage extends React.Component<Props, State> {
  tipRefs: React.RefObject<HTMLDivElement>[];

  constructor(props: Props) {
    super(props);

    this.state = {
      currentTip: 0
    };
    this.tipRefs = [
      React.createRef(),
      React.createRef(),
      React.createRef(),
      React.createRef(),
      React.createRef(),
    ];
  }

  handleNextTipClick = () => {
    this.setState(prevState => {
      return { currentTip: prevState.currentTip + 1 };
    },            () => {
      // Focus the revealed tip (mainly for screen readers)
      const { currentTip } = this.state;
      const el = this.tipRefs[currentTip].current;
      if (el) {
        el.focus();
      }
    });
  }

  render() {
    const { classes } = this.props;
    const { currentTip } = this.state;

    const tips = [];
    tips.push(
      <FormattedMessage
        id="onboarding-security-notice.correct-url-tip"
        description="Tip about checking the browser URL"
        defaultMessage={
          'When accessing this wallet, always type the URL into the browser address bar ' +
          'yourself or use a bookmark that you yourself created. Never trust links posted ' +
          'on social media, in search results, sent in emails or listed on other websites.'
        }
      />
    );
    tips.push(
      <FormattedMessage
        id="onboarding-security-notice.trust-browser-tip"
        description="Tip about truting your browser"
        defaultMessage={
          'If your browser gives you any sort of security warning about this web wallet, ' +
          'get in touch with us and report it. Do not ignore the warning nor enter your ' +
          'mnemonic secret!'
        }
      />
    );
    tips.push(
      <FormattedMessage
        id="onboarding-security-notice.own-devices-tip"
        description="Tip about untrustworthy devices"
        defaultMessage={
          'Only use your own devices when accessing your accounts. Do not enter your mnemonic ' +
          'secret on untrustworthy devices (public computers, friends computers/phones, etc) ' +
          'as they might be littered with malware and keyloggers.'
        }
      />
    );
    tips.push(
      <FormattedMessage
        id="onboarding-security-notice.apply-updates-tip"
        description="Tip about installing security updates"
        defaultMessage={
          'Always keep your operating system, anti-virus software and browser up to date with ' +
          'latest security updates.'
        }
      />
    );
    tips.push(
      <FormattedMessage
        id="onboarding-security-notice.hardware-wallets-tip"
        description="Tip about using hardware wallets"
        defaultMessage={
          'If possible, prefer hardware wallets over mnemonic secret for storing larger ' +
          'amounts of RISE.'
        }
      />
    );

    return (
      <ModalPaper open={true}>
        <ModalPaperHeader closeLink={{ route: onboardingNewAccountRoute }}>
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
              in={idx <= currentTip}
              aria-hidden={idx > currentTip}
            >
              <div tabIndex={idx <= currentTip ? 0 : -1} ref={this.tipRefs[idx]}>
                <Typography
                  className={classNames(
                    classes.tipText,
                    idx !== currentTip && classes.inactiveTipText
                  )}
                  children={tip}
                />
              </div>
            </Collapse>
          ))}
          {currentTip + 1 < tips.length ? (
            <Button
              className={classes.button}
              onClick={this.handleNextTipClick}
              fullWidth={true}
            >
              <FormattedMessage
                id="onboarding-security-notice.next-tip"
                description="Button label for when there are more tips to be revealed"
                defaultMessage="Next tip"
              />
            </Button>
          ) : (
            <Link route={onboardingNewMnemonicRoute}>
              <Button
                className={classes.button}
                fullWidth={true}
              >
                <FormattedMessage
                  id="onboarding-security-notice.continue"
                  description="Button label for when all of the tips have been seen"
                  defaultMessage="Continue"
                />
              </Button>
            </Link>
          )}
        </div>
      </ModalPaper>
    );
  }
}

export default stylesDecorator(SecurityNoticePage);
