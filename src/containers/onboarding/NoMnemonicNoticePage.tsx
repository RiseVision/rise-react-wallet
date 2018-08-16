import Button from '@material-ui/core/Button';
import {
  createStyles,
  Theme,
  withStyles,
  WithStyles
} from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import { inject, observer } from 'mobx-react';
import { RouterStore } from 'mobx-router';
import * as React from 'react';
import { FormattedMessage } from 'react-intl';
import ModalPaper from '../../components/ModalPaper';
import ModalPaperHeader from '../../components/ModalPaperHeader';
import { accountOverviewRoute } from '../../routes';

const styles = (theme: Theme) => createStyles({
  content: {
    padding: 20,
  },
  text: {
    marginTop: 10,
    '&:first-child': {
      marginTop: 0,
    },
  },
  button: {
    marginTop: 10,
  },
});

interface Props extends WithStyles<typeof styles> {
  routerStore?: RouterStore;
}

const stylesDecorator = withStyles(styles, { name: 'OnboardingSecurityNoticePage' });

@inject('routerStore')
@observer
class NoMnemonicNoticePage extends React.Component<Props> {

  constructor(props: Props) {
    super(props);
  }

  handleCloseClick = () => {
    const { routerStore } = this.props;
    routerStore!.goTo(accountOverviewRoute);
  }

  handleContinueClick = () => {
    const { routerStore } = this.props;
    routerStore!.goTo(accountOverviewRoute);
  }

  render() {
    const { classes } = this.props;

    return (
      <ModalPaper open={true}>
        <ModalPaperHeader closeButton={true} onCloseClick={this.handleCloseClick}>
          <FormattedMessage
            id="onboarding-no-mnemonic-notice.title"
            description="No passphrase notice screen title"
            defaultMessage="Your account was added"
          />
        </ModalPaperHeader>
        <div className={classes.content}>
          <Typography className={classes.text}>
            <FormattedMessage
              id="onboarding-no-mnemonic-notice.did-you-notice"
              description="Notice about asking for the passphrase only when making transactions"
              defaultMessage={
                'Did you notice that you didn\'t have to enter your passphrase? ' +
                'That\'s because you will only need to enter your mnemonic passphrase ' +
                'when you\'re about to make a transaction.'
              }
            />
          </Typography>
          <Typography className={classes.text}>
            <FormattedMessage
              id="onboarding-no-mnemonic-notice.written-down-mnemonic"
              description="Reminder to have the passphrase written down"
              defaultMessage={
                'Please make sure that your passphrase is written down securely ' +
                'so that you wouldn\'t forget it as it is usually not needed often.'
              }
            />
          </Typography>
          <Button
            className={classes.button}
            onClick={this.handleContinueClick}
            fullWidth={true}
          >
            <FormattedMessage
              id="onboarding-no-mnemonic-notice.continue"
              description="Continue button label"
              defaultMessage="Go to account overview"
            />
          </Button>
        </div>
      </ModalPaper>
    );
  }
}

export default stylesDecorator(NoMnemonicNoticePage);
