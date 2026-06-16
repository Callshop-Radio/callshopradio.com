import get from "lodash.get";
import { useFormValue } from "sanity";

const PlaceholderStringInput = (props) => {
  const { schemaType } = props;

  const path = schemaType?.options?.field;
  const doc = useFormValue([]);

  const proxyValue = path ? get(doc, path) : "";

  return props.renderDefault({
    ...props,
    elementProps: { ...props.elementProps, placeholder: proxyValue },
  });
};

export default PlaceholderStringInput;
