import Button from '@material-ui/core/Button';
import Radio from '@material-ui/core/es/Radio';
import TextField from '@material-ui/core/es/TextField';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import { createStyles, withStyles, WithStyles } from '@material-ui/core/styles';
import { inject, observer } from 'mobx-react';
import { RouterStore } from 'mobx-router-rise';
import { FormEvent } from 'react';
import * as React from 'react';
import { FormattedMessage } from 'react-intl';
import * as lstore from 'store';
import ModalPaper from '../../components/ModalPaper';
import ModalPaperHeader from '../../components/ModalPaperHeader';
import { onboardingAddAccountRoute } from '../../routes';
import WalletStore, { NetworkType } from '../../stores/wallet';
import { isMainnet } from '../../utils/utils';

const styles = createStyles({
  languageList: {
    maxWidth: 320
  },
  titleIcon: {
    margin: '-4px 4px'
  },
  radio: {
    paddingTop: 0,
    paddingBottom: 0,
  },
});

interface Props extends WithStyles<typeof styles> {}

interface PropsInjected extends Props {
  walletStore: WalletStore;
  routerStore: RouterStore;
}

interface State {
  network: NetworkType;
  url?: string;
  urlError?: boolean;
}

const stylesDecorator = withStyles(styles, {
  name: 'OnboardingChooseLanguagePage'
});

@inject('walletStore')
@inject('routerStore')
@observer
class ChooseNetworkPage extends React.Component<Props, State> {
  get injected(): PropsInjected {
    // @ts-ignore
    return this.props;
  }

  constructor(props: Props) {
    super(props);
    const { walletStore } = this.injected;
    const { type = null, url = null } = lstore.get('network') || {};
    // set from settings
    if (type) {
      this.state = {
        network: type,
        url
      };
    } else {
      // auto detect
      this.state = {
        network: isMainnet(walletStore.config.domain)
          ? 'mainnet'
          : 'testnet',
      };
    }
  }

  handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ network: event.target.value as NetworkType });
  }

  handleSetNetwork = (network: NetworkType) => () => {
    this.setState({ network });
  }

  handleCustomURL = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({
      url: event.target.value,
      urlError: false
    });
  }

  handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const { routerStore, walletStore } = this.injected;
    const { url = '', network } = this.state;
    let error = false;
    if (network === 'custom') {
      try {
        if (!url) {
          throw new Error('No URL');
        }
        const nethash = await walletStore.checkNodesNethash(url);
        if (!nethash) {
          throw new Error('Nethash check failed');
        }
      } catch {
        error = true;
      }
    }
    if (error) {
      this.setState({
        urlError: true
      });
    } else {
      walletStore.setNetwork(network, url);
      routerStore.goTo(onboardingAddAccountRoute);
    }
  }

  render() {
    const { classes } = this.injected;
    const { network, url, urlError } = this.state;

    return (
      <ModalPaper open={true}>
        <ModalPaperHeader backLink={{ route: onboardingAddAccountRoute }}>
          <FormattedMessage
            id="onboarding-choose-network.title"
            description="Choose network screen title"
            defaultMessage="Change node"
          />
        </ModalPaperHeader>
        <form onSubmit={this.handleSubmit}>
          <List>
            <ListItem button={true} onClick={this.handleSetNetwork('mainnet')}>
              <ListItemText>
                <Radio
                  className={classes.radio}
                  name="network"
                  value="mainnet"
                  onChange={this.handleChange}
                  checked={network === 'mainnet'}
                />
                <FormattedMessage
                  id="onboarding-choose-network.official-main-network"
                  description="Label for official main network"
                  defaultMessage="Official mainnet"
                />
              </ListItemText>
            </ListItem>
            <ListItem button={true} onClick={this.handleSetNetwork('testnet')}>
              <ListItemText>
                <Radio
                  className={classes.radio}
                  name="network"
                  value="testnet"
                  onChange={this.handleChange}
                  checked={network === 'testnet'}
                />
                <FormattedMessage
                  id="onboarding-choose-network.official-test-network"
                  description="Label for official test network"
                  defaultMessage="Official testnet"
                />
              </ListItemText>
            </ListItem>
            <ListItem button={true}>
              <ListItemText onClick={this.handleSetNetwork('custom')}>
                <Radio
                  name="network"
                  value="custom"
                  onChange={this.handleChange}
                  checked={network === 'custom'}
                />
                <TextField
                  onFocus={this.handleSetNetwork('custom')}
                  label={
                    this.state.urlError ? (
                      <FormattedMessage
                        id="choose-network.invalid-custom-url"
                        description="Custom URL text field error"
                        defaultMessage="Invalid node URL"
                      />
                    ) : (
                      <FormattedMessage
                        id="choose-network.custom-url"
                        description="Custom URL text field label"
                        defaultMessage="Custom node URL"
                      />
                    )
                  }
                  onChange={this.handleCustomURL}
                  error={urlError}
                  value={url}
                />
              </ListItemText>
            </ListItem>
            <ListItem>
              <Button type="submit" fullWidth={true}>
                <FormattedMessage
                  id="choose-network.submit-button"
                  description="Select node submit button"
                  defaultMessage="Select node"
                />
              </Button>
            </ListItem>
          </List>
        </form>
      </ModalPaper>
    );
  }
}

export default stylesDecorator(ChooseNetworkPage);
