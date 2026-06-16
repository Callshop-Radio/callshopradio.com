import { useFormValue } from "sanity";

const PlaceholderStringInput = (props) => {
  const { schemaType } = props;

  const path = schemaType?.options?.field;
  const doc = useFormValue([]);

  // Walk `a.b.c` through the form value — replaces lodash.get (deprecated).
  const proxyValue = path
    ? path.split(".").reduce((obj, key) => obj?.[key], doc)
    : "";

  return props.renderDefault({
    ...props,
    elementProps: {
      ...(props.elementProps ?? {}),
      placeholder: proxyValue,
    },
  });
};

export default PlaceholderStringInput;
