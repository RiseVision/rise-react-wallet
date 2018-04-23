import * as React from 'react';
import { FormattedMessage } from 'react-intl';
import List, { ListItem, ListItemIcon, ListItemText } from 'material-ui/List';
import LanguageIcon from '@material-ui/icons/Language';
import KeyboardArrowRight from '@material-ui/icons/KeyboardArrowRight';
import ModalPaper from '../components/ModalPaper';
import ModalPaperHeader from '../components/ModalPaperHeader';

class OnboardingAddAccountPage extends React.Component {
  render() {
    return (
      <ModalPaper>
        <ModalPaperHeader>
          <FormattedMessage
            id="onboarding-add-account.title"
            description="Add account view title"
            defaultMessage="RISE wallet"
          />
        </ModalPaperHeader>
        <List>
          <ListItem button={true}>
            <ListItemText
              primary={(
                <FormattedMessage
                  id="onboarding-add-account.new-account"
                  description="New account button title"
                  defaultMessage="New account"
                />
              )}
              secondary={(
                <FormattedMessage
                  id="onboarding-add-account.new-account-tip"
                  description="New account button tip"
                  defaultMessage="I want to create a new account on the RISE network"
                />
              )}
            />
            <KeyboardArrowRight />
          </ListItem>
          <ListItem button={true}>
            <ListItemText
              primary={(
                <FormattedMessage
                  id="onboarding-add-account.existing-account"
                  description="Existing account button title"
                  defaultMessage="Existing account"
                />
              )}
              secondary={(
                <FormattedMessage
                  id="onboarding-add-account.existing-account-tip"
                  description="Existing account button tip"
                  defaultMessage="I want to access an account that already exists on the RISE network"
                />
              )}
            />
            <KeyboardArrowRight />
          </ListItem>
          <ListItem button={true}>
            <ListItemIcon>
              <LanguageIcon />
            </ListItemIcon>
            <ListItemText>
              <FormattedMessage
                id="onboarding-add-account.change-language"
                description="Change language button label"
                defaultMessage="Change language"
              />
            </ListItemText>
            <KeyboardArrowRight />
          </ListItem>
        </List>
      </ModalPaper>
    );
  }
}

export default OnboardingAddAccountPage;
