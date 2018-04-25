import * as React from 'react';
import { FormattedMessage } from 'react-intl';
import List, { ListItem, ListItemText } from 'material-ui/List';
import KeyboardArrowRight from '@material-ui/icons/KeyboardArrowRight';
import ModalPaper from '../components/ModalPaper';
import ModalPaperHeader from '../components/ModalPaperHeader';

interface Props {
  onGoBack: () => void;
}

class OnboardingNewAccountPage extends React.Component<Props> {
  constructor(props: Props) {
    super(props);

    this.handleBackClick = this.handleBackClick.bind(this);
  }

  handleBackClick() {
    this.props.onGoBack();
  }

  render() {
    return (
      <ModalPaper>
        <ModalPaperHeader backButton={true} onBackClick={this.handleBackClick}>
          <FormattedMessage
            id="onboarding-new-account.title"
            description="Create account screen title"
            defaultMessage="Create an account"
          />
        </ModalPaperHeader>
        <List>
          <ListItem button={true}>
            <ListItemText
              primary={(
                <FormattedMessage
                  id="onboarding-new-account.using-mnemonic"
                  description="New account w/ a mnemonic button title"
                  defaultMessage="New account with a mnemonic passphrase"
                />
              )}
              secondary={(
                <FormattedMessage
                  id="onboarding-new-account.using-mnemonic-tip"
                  description="New account w/ a mnemonic button tip"
                  defaultMessage={'I want to create a new RISE account that '
                    + 'can be accessed with a passphrase'}
                />
              )}
            />
            <KeyboardArrowRight />
          </ListItem>
          <ListItem button={true}>
            <ListItemText
              primary={(
                <FormattedMessage
                  id="onboarding-new-account.using-ledger"
                  description="New account w/ Ledger button title"
                  defaultMessage="New account with a Ledger hardware wallet"
                />
              )}
              secondary={(
                <FormattedMessage
                  id="onboarding-new-account.using-ledger-tip"
                  description="New account w/ Ledger button tip"
                  defaultMessage={'I want to create a new RISE account that '
                    + 'can be accessed with a Ledger hardware wallet'}
                />
              )}
            />
            <KeyboardArrowRight />
          </ListItem>
        </List>
      </ModalPaper>
    );
  }
}

export default OnboardingNewAccountPage;
