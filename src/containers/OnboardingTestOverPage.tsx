import * as React from 'react';
import { FormattedMessage } from 'react-intl';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';
import ModalPaper from '../components/ModalPaper';
import ModalPaperHeader from '../components/ModalPaperHeader';
import { createStyles, withStyles, WithStyles } from '@material-ui/core/styles';

const styles = createStyles({
  content: {
    padding: 20,
    textAlign: 'center',
    maxWidth: 400,
  },
});

interface Props extends WithStyles<typeof styles> {
  open: boolean;
  onGoHome: () => void;
}

interface State {
  open: boolean;
}

const stylesDecorator = withStyles(styles, { name: 'OnboardingTestOverPage' });

const OnboardingTestOverPage = stylesDecorator(
  class extends React.Component<Props, State> {
    static getDerivedStateFromProps(nextProps: Readonly<Props>, prevState: State): Partial<State> | null {
      let state = {
        ...prevState,
        open: nextProps.open,
      };

      return state;
    }

    constructor(props: Props) {
      super(props);

      this.state = {
        open: props.open,
      };
    }

    handleCloseClick = () => {
      this.props.onGoHome();
    }

    render() {
      const { classes } = this.props;
      const { open } = this.state;

      return (
        <ModalPaper open={open}>
          <ModalPaperHeader closeButton={true} onCloseClick={this.handleCloseClick}>
            <FormattedMessage
              id="onboarding-test-over.title"
              description="Test finished screen title"
              defaultMessage="End of test"
            />
          </ModalPaperHeader>
          <Grid
            container={true}
            className={classes.content}
            spacing={16}
          >
            <Grid item={true} xs={12}>
              <Typography>
                <FormattedMessage
                  id="onboarding-test-over.thank-you-message"
                  description="Text thanking the user on partaking in the test"
                  defaultMessage={
                    `Thank you for taking the time to participate in this test. ` +
                    `Any and all feedback you can give us will help us create a ` +
                    `better wallet for the RISE community.`
                  }
                />
              </Typography>
            </Grid>
            <Grid item={true} xs={12}>
              <Button fullWidth={true} onClick={this.handleCloseClick}>
                <FormattedMessage
                  id="onboarding-test-over.reset"
                  description="Reset button label"
                  defaultMessage="Restart test"
                />
              </Button>
            </Grid>
          </Grid>
        </ModalPaper>
      );
    }
  }
);

export default OnboardingTestOverPage;
