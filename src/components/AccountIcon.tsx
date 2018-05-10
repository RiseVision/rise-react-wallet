import * as React from 'react';
import { withStyles, WithStyles } from 'material-ui/styles';
import jdenticon from '../utils/jdenticon';

type AccountIconClassKey =
  | 'root';

const stylesDecorator = withStyles<AccountIconClassKey>(
  {
    root: {
    },
  },
  { name: 'AccountIcon' }
);

interface Props {
  size?: number;
  address: string;
}

type DecoratedProps = Props & WithStyles<AccountIconClassKey>;

const AccountIcon = stylesDecorator<Props>(
  class extends React.Component<DecoratedProps> {
    readonly svgElement = React.createRef<SVGSVGElement>();

    componentDidMount() {
      this.generateSvg();
    }

    componentDidUpdate() {
      this.generateSvg();
    }

    generateSvg() {
      const svgElement = this.svgElement.current;
      if (svgElement) {
        jdenticon.update(svgElement, this.props.address, 0.1);
      }
    }

    render() {
      const { classes, size } = this.props;
      return (
        <svg
          className={classes.root}
          ref={this.svgElement}
          width={size || 64}
          height={size || 64}
        />
      );
    }
  }
);

export default AccountIcon;
