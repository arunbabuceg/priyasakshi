"""Courier catalog — display names and tracking URLs.

Mirrors ``frontend/src/lib/couriers.js`` so status emails can render the same
courier name and tracking link the UI shows. Orders store the courier *code*;
free-text values written before the dropdown existed still resolve through
``resolve_courier``.
"""

from __future__ import annotations

import re
from typing import Optional
from urllib.parse import quote


class Courier:
    __slots__ = ("code", "name", "home", "track_template")

    def __init__(self, code: str, name: str, home: str, track_template: Optional[str] = None):
        self.code = code
        self.name = name
        self.home = home
        self.track_template = track_template

    def tracking_url(self, number: Optional[str]) -> str:
        number = (number or "").strip()
        if self.track_template and number:
            return self.track_template.format(number=quote(number, safe=""))
        return self.home


COURIERS: tuple[Courier, ...] = (
    Courier(
        "india_post",
        "India Post",
        "https://www.indiapost.gov.in/_layouts/15/DOP.Portal.Tracking/TrackConsignment.aspx",
    ),
    Courier(
        "speed_post",
        "Speed Post",
        "https://www.indiapost.gov.in/_layouts/15/DOP.Portal.Tracking/TrackConsignment.aspx",
    ),
    Courier("dtdc", "DTDC", "https://www.dtdc.in/track"),
    Courier("professional_couriers", "Professional Couriers", "https://www.tpcindia.com/"),
    Courier("st_courier", "ST Courier", "https://www.stcourier.com/track/shipment"),
    Courier(
        "blue_dart",
        "Blue Dart",
        "https://www.bluedart.com/tracking",
        "https://www.bluedart.com/web/guest/trackdartresult?trackFor=0&trackNo={number}",
    ),
    Courier(
        "delhivery",
        "Delhivery",
        "https://www.delhivery.com/tracking",
        "https://www.delhivery.com/track/package/{number}",
    ),
    Courier(
        "xpressbees",
        "XpressBees",
        "https://www.xpressbees.com/shipment/tracking",
        "https://www.xpressbees.com/shipment/tracking?awbNo={number}",
    ),
    Courier(
        "ecom_express",
        "Ecom Express",
        "https://ecomexpress.in/tracking/",
        "https://ecomexpress.in/tracking/?awb_field={number}",
    ),
    Courier(
        "shadowfax",
        "Shadowfax",
        "https://tracker.shadowfax.in/",
        "https://tracker.shadowfax.in/#/tracker/{number}",
    ),
    Courier(
        "fedex",
        "FedEx",
        "https://www.fedex.com/en-in/tracking.html",
        "https://www.fedex.com/fedextrack/?trknbr={number}",
    ),
    Courier(
        "dhl",
        "DHL",
        "https://www.dhl.com/in-en/home/tracking.html",
        "https://www.dhl.com/in-en/home/tracking/tracking-express.html?submit=1&tracking-id={number}",
    ),
)

COURIER_CODES = tuple(c.code for c in COURIERS)

_LEGACY_ALIASES = {
    "bluedart": "blue_dart",
    "blue_dart_express": "blue_dart",
    "indiapost": "india_post",
    "india_speed_post": "speed_post",
    "speedpost": "speed_post",
    "dtdc_express": "dtdc",
    "professional": "professional_couriers",
    "the_professional_couriers": "professional_couriers",
    "tpc": "professional_couriers",
    "stcourier": "st_courier",
    "ecom": "ecom_express",
    "ecomexpress": "ecom_express",
    "xpress_bees": "xpressbees",
    "fed_ex": "fedex",
}


def _slug(value: object) -> str:
    return re.sub(r"[^a-z0-9]+", "_", str(value or "").lower()).strip("_")


_BY_KEY: dict[str, Courier] = {}
for _c in COURIERS:
    _BY_KEY[_c.code] = _c
    _BY_KEY[_slug(_c.name)] = _c


def resolve_courier(value: object) -> Optional[Courier]:
    key = _slug(value)
    if not key:
        return None
    return _BY_KEY.get(key) or _BY_KEY.get(_LEGACY_ALIASES.get(key, ""))


def courier_name(value: object) -> str:
    courier = resolve_courier(value)
    return courier.name if courier else (str(value) if value else "")


def tracking_url(courier_value: object, tracking_number: object) -> Optional[str]:
    courier = resolve_courier(courier_value)
    if not courier:
        return None
    return courier.tracking_url(str(tracking_number) if tracking_number else None)
