import * as React from 'react';
import { FormattedMessage } from 'react-intl';
import Grid from 'material-ui/Grid';
import Typography from 'material-ui/Typography';
import TextField from 'material-ui/TextField';
import Button from 'material-ui/Button';
import ModalPaper from '../components/ModalPaper';
import ModalPaperHeader from '../components/ModalPaperHeader';
import AccountIcon from '../components/AccountIcon';
import { withStyles, WithStyles } from 'material-ui/styles';

type OnboardingExistingAccountPageClassKey =
  | 'content'
  | 'accountContainer'
  | 'accountField'
  | 'accountIcon';

const stylesDecorator = withStyles<OnboardingExistingAccountPageClassKey>(
  {
    content: {
      padding: 20,
    },
    accountContainer: {
      display: 'flex',
      alignItems: 'center',
    },
    accountField: {
      flex: 1,
    },
    accountIcon: {
      marginLeft: 10,
    },
  },
  { name: 'OnboardingExistingAccountPage' }
);

interface Props {
  onGoBack: () => void;
  onAddressEntered: (address: string) => void;
}

interface State {
  address: string;
  addressInvalid: boolean;
  normalizedAddress: string;
}

type DecoratedProps = Props & WithStyles<OnboardingExistingAccountPageClassKey>;

const OnboardingExistingAccountPage = stylesDecorator<Props>(
  class extends React.Component<DecoratedProps, State> {
    constructor(props: DecoratedProps) {
      super(props);
      this.state = {
        address: '',
        addressInvalid: false,
        normalizedAddress: '',
      };
    }

    handleBackClick = () => {
      this.props.onGoBack();
    }

    handleFormSubmit = (ev: React.FormEvent<HTMLFormElement>) => {
      ev.preventDefault();

      const { normalizedAddress } = this.state;
      const addressInvalid = !normalizedAddress;
      if (addressInvalid) {
        this.setState({ addressInvalid: true });
        return;
      }

      this.props.onAddressEntered(normalizedAddress);
    }

    handleAddressChange = (ev: React.ChangeEvent<HTMLInputElement>) => {
      const address = ev.target.value;
      const normalizedAddress = normalizeAddress(address);

      this.setState({
        address,
        addressInvalid: false,
        normalizedAddress,
      });
    }

    handleAddressBlur = () => {
      const { address, normalizedAddress } = this.state;
      const addressInvalid = !!address && !normalizedAddress;
      this.setState({ addressInvalid });
    }

    render() {
      const { classes } = this.props;

      return (
        <ModalPaper>
          <ModalPaperHeader backButton={true} onBackClick={this.handleBackClick}>
            <FormattedMessage
              id="onboarding-existing-account.title"
              description="Existing account screen title"
              defaultMessage="Existing account"
            />
          </ModalPaperHeader>
          <Grid
            container={true}
            className={classes.content}
            spacing={16}
            component="form"
            onSubmit={this.handleFormSubmit}
          >
            <Grid item={true} xs={12}>
              <Typography>Enter the address of an existing RISE account you wish to access:</Typography>
            </Grid>
            <Grid item={true} xs={12}>
              <div className={classes.accountContainer}>
                <TextField
                  className={classes.accountField}
                  label="Account address"
                  error={this.state.addressInvalid}
                  value={this.state.address}
                  onChange={this.handleAddressChange}
                  onBlur={this.handleAddressBlur}
                />
                <AccountIcon
                  className={classes.accountIcon}
                  size={48}
                  address={this.state.normalizedAddress}
                />
              </div>
            </Grid>
            <Grid item={true} xs={12}>
              <Button type="submit" fullWidth={true}>
                Continue
              </Button>
            </Grid>
            <Grid item={true} xs={12}>
              <Typography>
                Forgotten your address but have your secret mnemonic? Click here
              </Typography>
            </Grid>
          </Grid>
        </ModalPaper>
      );
    }
  }
);

function normalizeAddress(address: string): string {
  const normalizedAddress = address.toUpperCase();
  if (!normalizedAddress.match(/^\d{1,20}R$/)) {
    return '';
  } else {
    return normalizedAddress;
  }
}

export default OnboardingExistingAccountPage;
