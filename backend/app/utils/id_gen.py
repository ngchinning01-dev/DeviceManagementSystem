import re


def next_id(existing_ids):
    """
    Return the next ID by detecting the pattern of existing IDs.

    Strips a common letter prefix, finds the highest numeric suffix, and
    increments it while preserving zero-padding width.

    Examples:
      ['BR1000', 'BR1001', 'BR1002'] -> 'BR1003'
      ['DV214', 'DV215', 'DV216']   -> 'DV217'
      ['1', '2', '3']               -> '4'
      []                            -> '1'
    """
    pattern = re.compile(r'^([A-Za-z]*)(\d+)$')
    parsed = []
    for id_ in existing_ids:
        m = pattern.match(str(id_).strip())
        if m:
            parsed.append((m.group(1), int(m.group(2)), len(m.group(2))))

    if not parsed:
        return str(len(existing_ids) + 1)

    parsed.sort(key=lambda x: x[1])
    prefix, num, num_len = parsed[-1]
    return prefix + str(num + 1).zfill(num_len)
